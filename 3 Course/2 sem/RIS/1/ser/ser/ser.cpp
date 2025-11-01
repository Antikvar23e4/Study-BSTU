#define _WINSOCK_DEPRECATED_NO_WARNINGS
#define _CRT_SECURE_NO_WARNINGS
#include <iostream>
#include <winsock2.h>
#include <ctime>
#include <thread>
#include <mutex>

#pragma comment(lib, "ws2_32.lib")

using namespace std;

string GetErrorMsgText(int code) {
    string msgText;
    switch (code) {
    case WSAEINTR:          msgText = "WSAEINTR: Работа функции прервана"; break;
    case WSAEACCES:         msgText = "WSAEACCES: Разрешение отвергнуто"; break;
    case WSAEFAULT:         msgText = "WSAEFAULT: Ошибочный адрес"; break;
    case WSAEINVAL:         msgText = "WSAEINVAL: Ошибка в аргументе"; break;
    case WSAEMFILE:         msgText = "WSAEMFILE: Слишком много файлов открыто"; break;
    case WSAEWOULDBLOCK:    msgText = "WSAEWOULDBLOCK: Ресурс временно недоступен"; break;
    case WSAEINPROGRESS:    msgText = "WSAEINPROGRESS: Операция в процессе развития"; break;
    case WSAEALREADY:       msgText = "WSAEALREADY: Операция уже выполняется"; break;
    case WSAENOTSOCK:       msgText = "WSAENOTSOCK: Сокет задан неправильно"; break;
    case WSAEDESTADDRREQ:   msgText = "WSAEDESTADDRREQ: Требуется адрес расположения"; break;
    case WSAEMSGSIZE:       msgText = "WSAEMSGSIZE: Сообщение слишком длинное"; break;
    case WSAEPROTOTYPE:     msgText = "WSAEPROTOTYPE: Неправильный тип протокола для сокета"; break;
    default:                msgText = "***ERROR***: Unknown error"; break;
    }
    return msgText;
}

string SetErrorMsgText(string msgText, int code) {
    return msgText + " " + GetErrorMsgText(code);
}

struct GETSINCHRO {
    char cmd[4];
    int curvalue;
};

struct SETSINCHRO {
    char cmd[4];
    int correction;
};

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


mutex timeMutex;
time_t globalServerTime = 0;
const char* ntpServer = "ntp4.ntp-servers.net";// адрес ntp

time_t getNTPTime() {
    SOCKET sock;
    sockaddr_in ntpAddr;
    NTPPacket packet = {};
    packet.li_vn_mode = 0x1B;// версия протокола NTP 3, клиентский режим

    WSAData wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);

    sock = socket(AF_INET, SOCK_DGRAM, 0);
    hostent* host = gethostbyname(ntpServer);
    if (!host) {
        closesocket(sock);
        WSACleanup();
        return 0;
    }

    ntpAddr.sin_family = AF_INET;
    ntpAddr.sin_port = htons(123);
    ntpAddr.sin_addr.s_addr = *(u_long*)host->h_addr;

    sendto(sock, (char*)&packet, sizeof(NTPPacket), 0, (sockaddr*)&ntpAddr, sizeof(ntpAddr));
    int addrSize = sizeof(ntpAddr);
    recvfrom(sock, (char*)&packet, sizeof(NTPPacket), 0, (sockaddr*)&ntpAddr, &addrSize);

    closesocket(sock);
    WSACleanup();

    unsigned long ntpTime = ntohl(packet.txTm_s) - 2208988800U;//переводит порядок байтов времени NTP в стандартный порядок
    
    return (time_t)ntpTime;
}

void updateTime() {
    while (true) {
        time_t newTime = getNTPTime();
        {
            lock_guard<mutex> lock(timeMutex);
            globalServerTime = newTime;
        }
        cout << "Глобальное время NTP: " << globalServerTime << std::endl;
        this_thread::sleep_for(chrono::seconds(10));
    }
}

int main() {
    setlocale(LC_ALL, "Russian");
    WSADATA wsaData;
    SOCKET Ss;
    sockaddr_in serverAddr, clientAddr;
    int clientAddrSize = sizeof(clientAddr);
    GETSINCHRO recvData;
    SETSINCHRO sendData;

    WSAStartup(MAKEWORD(2, 2), &wsaData);
    Ss = socket(AF_INET, SOCK_DGRAM, 0);

    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(3000);

    bind(Ss, (sockaddr*)&serverAddr, sizeof(serverAddr));

    std::thread timeUpdater(updateTime);
    timeUpdater.detach();

    while (true) {
        int recvSize = recvfrom(Ss, (char*)&recvData, sizeof(recvData), 0, (sockaddr*)&clientAddr, &clientAddrSize);
        if (recvSize > 0) {
            int correction;
            {
                lock_guard<mutex> lock(timeMutex);
                correction = globalServerTime - recvData.curvalue;
            }
            cout << "========================================" << endl;
            cout << "Клиент: " << inet_ntoa(clientAddr.sin_addr) << endl;
            cout << "Время клиента: " << recvData.curvalue << endl;
            cout << "Текущее время: " << globalServerTime << endl;
            cout << "Коррекция: " << correction << " мс" << endl;
            cout << "========================================" << endl;

            strcpy(sendData.cmd, "ACK");
            sendData.correction = correction;
            sendto(Ss, (char*)&sendData, sizeof(sendData), 0, (sockaddr*)&clientAddr, clientAddrSize);
        }
    }

    closesocket(Ss);
    WSACleanup();
    return 0;
}
