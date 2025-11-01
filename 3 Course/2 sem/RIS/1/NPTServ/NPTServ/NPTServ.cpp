#define _WINSOCK_DEPRECATED_NO_WARNINGS
#define _CRT_SECURE_NO_WARNINGS
#include <iostream>
#include <winsock2.h>
#include <ctime>
#include <thread>
#include <mutex>

#pragma comment(lib, "ws2_32.lib")

using namespace std;

struct NTPPacket {
    uint8_t li_vn_mode;
    uint8_t stratum;
    uint8_t poll;
    uint8_t precision;
    uint32_t rootDelay;
    uint32_t rootDispersion;
    uint32_t refId;
    uint32_t refTm_s;
    uint32_t refTm_f;
    uint32_t origTm_s;
    uint32_t origTm_f;
    uint32_t rxTm_s;
    uint32_t rxTm_f;
    uint32_t txTm_s;
    uint32_t txTm_f;
};

struct GETSINCHRO {
    char command[4];
    int64_t correction;
};

struct SETSINCHRO {
    char command[4];
    int64_t correction;
};

std::mutex timeMutex;
int64_t globalUnixTimeMs = 0;

time_t getNetworkTimeMs() {
    WSADATA wsaData;
    SOCKET socketDescriptor;
    sockaddr_in ntpServerAddress;
    const char* ntpServer = "pool.ntp.org";
    hostent* host;

    WSAStartup(MAKEWORD(2, 2), &wsaData);
    socketDescriptor = socket(AF_INET, SOCK_DGRAM, 0);

    if ((host = gethostbyname(ntpServer)) == nullptr) {
        cerr << "Ошибка DNS" << endl;
        closesocket(socketDescriptor);
        WSACleanup();
        return 0;
    }

    ntpServerAddress.sin_family = AF_INET;
    ntpServerAddress.sin_port = htons(123);
    memcpy(&ntpServerAddress.sin_addr, host->h_addr_list[0], host->h_length);

    NTPPacket ntpPacket = { 0 };
    ntpPacket.li_vn_mode = 0x1B;

    sendto(socketDescriptor, (char*)&ntpPacket, sizeof(ntpPacket), 0, (sockaddr*)&ntpServerAddress, sizeof(ntpServerAddress));

    sockaddr_in responseAddress;
    int responseAddressSize = sizeof(responseAddress);
    recvfrom(socketDescriptor, (char*)&ntpPacket, sizeof(ntpPacket), 0, (sockaddr*)&responseAddress, &responseAddressSize);

    closesocket(socketDescriptor);
    WSACleanup();

    ntpPacket.txTm_s = ntohl(ntpPacket.txTm_s);
    ntpPacket.txTm_f = ntohl(ntpPacket.txTm_f);
    return ((int64_t)(ntpPacket.txTm_s - 2208988800U) * 1000) + ((ntpPacket.txTm_f * 1000) / 0x100000000ULL);
}

void updateGlobalTime() {
    while (true) {
        int64_t updatedTimeMs = getNetworkTimeMs();
        {
            lock_guard<mutex> lock(timeMutex);
            globalUnixTimeMs = updatedTimeMs;
        }
        cout << "========================================" << endl;
        cout << "Текущее UNIX-время (мс): " << globalUnixTimeMs << endl;
        cout << "========================================" << endl;
        this_thread::sleep_for(chrono::seconds(10));
    }
}

int main() {
    setlocale(LC_ALL, "Russian");
    WSADATA wsaData;
    SOCKET Ss;
    sockaddr_in serverAddr, clientAddr;
    int clientAddressSize = sizeof(clientAddr);
    GETSINCHRO receivedRequest;
    SETSINCHRO responseToClient;

    WSAStartup(MAKEWORD(2, 2), &wsaData);
    Ss = socket(AF_INET, SOCK_DGRAM, 0);

    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(3000);

    bind(Ss, (sockaddr*)&serverAddr, sizeof(serverAddr));

    thread timeUpdater(updateGlobalTime);
    timeUpdater.detach();

    while (true) {
        int receivedBytes = recvfrom(Ss, (char*)&receivedRequest, sizeof(receivedRequest), 0, (sockaddr*)&clientAddr, &clientAddressSize);
        if (receivedBytes > 0) {
            int64_t correction;
            {
                lock_guard<mutex> lock(timeMutex);
                correction = globalUnixTimeMs - receivedRequest.correction;
            }

            cout << "========================================" << endl;
            cout << "Клиент: " << inet_ntoa(clientAddr.sin_addr) << endl;
            cout << "Время клиента (мс): " << receivedRequest.correction << endl;
            cout << "Текущее время (мс): " << globalUnixTimeMs << endl;
            cout << "Коррекция (мс): " << correction << " мс" << endl;
            cout << "========================================" << endl;

            strcpy(responseToClient.command, "ACK");
            responseToClient.correction = correction;
            sendto(Ss, (char*)&responseToClient, sizeof(responseToClient), 0, (sockaddr*)&clientAddr, clientAddressSize);
        }
    }

    closesocket(Ss);
    WSACleanup();
    return 0;
}