#define _WINSOCK_DEPRECATED_NO_WARNINGS
#define _CRT_SECURE_NO_WARNINGS

#include <iostream>
#include <winsock2.h>
#include <chrono>
#include <thread>
#include <windows.h>
#include <mutex>

#pragma comment(lib, "ws2_32.lib")

using namespace std;

struct GETSINCHRO {
    char cmd[4];
    int curvalue;
};

struct SETSINCHRO {
    char cmd[4];
    int correction;
};

mutex timeMutex;
time_t globalServerTime = 0;
double avgCorrection = 0.0;
double avgCc_OStime = 0.0;
int requestInterval;
int maxRequests;
int timeoutSeconds;
bool isClientRunning = true;
SOCKET clientSocket;

// Функция для завершения работы
void cleanup() {
    isClientRunning = false;
    if (clientSocket != INVALID_SOCKET) {
        closesocket(clientSocket);
    }
    WSACleanup();
}

time_t get_local_time_unix() {
    SYSTEMTIME st;
    FILETIME ft;
    ULARGE_INTEGER ui;

    GetSystemTime(&st);
    SystemTimeToFileTime(&st, &ft);
    ui.LowPart = ft.dwLowDateTime;
    ui.HighPart = ft.dwHighDateTime;

    return (time_t)((ui.QuadPart / 10000000ULL) - 11644473600ULL);
}

void set_system_time(time_t newTime) {
    SYSTEMTIME st;
    FILETIME ft;
    ULARGE_INTEGER ui;

    ui.QuadPart = (newTime + 11644473600ULL) * 10000000ULL;
    ft.dwLowDateTime = ui.LowPart;
    ft.dwHighDateTime = ui.HighPart;

    FileTimeToSystemTime(&ft, &st);
    SetSystemTime(&st);
}

time_t get_ntp_time() {
    SOCKET sock = socket(AF_INET, SOCK_DGRAM, 0);
    if (sock == INVALID_SOCKET) {
        cout << "Ошибка создания сокета NTP: " << WSAGetLastError() << endl;
        return 0;
    }

    sockaddr_in ntpAddr;
    char packet[48] = { 0x1B };
    char response[48];

    ntpAddr.sin_family = AF_INET;
    ntpAddr.sin_port = htons(123);
    ntpAddr.sin_addr.s_addr = inet_addr("129.6.15.28");

    int sent = sendto(sock, packet, sizeof(packet), 0, (sockaddr*)&ntpAddr, sizeof(ntpAddr));
    if (sent == SOCKET_ERROR) {
        closesocket(sock);
        return 0;
    }

    int addrSize = sizeof(ntpAddr);
    int received = recvfrom(sock, response, sizeof(response), 0, (sockaddr*)&ntpAddr, &addrSize);
    if (received == SOCKET_ERROR) {
        closesocket(sock);
        return 0;
    }

    closesocket(sock);
    return (time_t)(ntohl(*(unsigned long*)&response[40]) - 2208988800U);
}

void update_global_time() {
    while (isClientRunning) {
        time_t newTime = get_ntp_time();
        if (newTime > 0) {
            lock_guard<mutex> lock(timeMutex);
            globalServerTime = newTime;
            cout << "Текущее UNIX-время (NTP): " << globalServerTime << endl;
        }
        this_thread::sleep_for(chrono::milliseconds(requestInterval));
    }
}

void update_local_time_from_server(sockaddr_in serverAddr) {
    int requestCount = 0;
    auto startTime = chrono::steady_clock::now();

    while (isClientRunning && requestCount < maxRequests) {
        auto elapsedTime = chrono::duration_cast<chrono::seconds>(chrono::steady_clock::now() - startTime).count();
        if (elapsedTime > 10) {
            cout << "Сервер не отвечает. Завершаем работу..." << endl;
            cleanup();
            return;
        }

        time_t localTime = get_local_time_unix();
        GETSINCHRO sendData;
        sendData.curvalue = static_cast<int>(localTime);
        strcpy(sendData.cmd, "REQ");

        int sent = sendto(clientSocket, (char*)&sendData, sizeof(sendData), 0, (sockaddr*)&serverAddr, sizeof(serverAddr));
        if (sent == SOCKET_ERROR) {
            cout << "Ошибка отправки данных: " << WSAGetLastError() << endl;
            continue;
        }

        struct timeval timeout;
        timeout.tv_sec = 5;
        timeout.tv_usec = 0;
        setsockopt(clientSocket, SOL_SOCKET, SO_RCVTIMEO, (char*)&timeout, sizeof(timeout));

        SETSINCHRO recvData = {};
        int serverAddrSize = sizeof(serverAddr);
        int bytesReceived = recvfrom(clientSocket, (char*)&recvData, sizeof(recvData), 0, (sockaddr*)&serverAddr, &serverAddrSize);


        int correction = recvData.correction;
        time_t newTime = localTime + correction;
        set_system_time(newTime);

        requestCount++;
        if (requestCount > 1) {
            avgCorrection += (correction - avgCorrection) / requestCount;
            time_t localNtpDiff = globalServerTime - localTime;
            avgCc_OStime += (localNtpDiff - avgCc_OStime) / requestCount;
        }

        lock_guard<mutex> lock(timeMutex);
        cout << "Запрос №" << requestCount << endl;
        cout << "Локальное время ОС: " << localTime << endl;
        cout << "Коррекция с сервера: " << correction << endl;
        cout << "Новое время после коррекции: " << newTime << endl;
        cout << "Средняя коррекция: " << avgCorrection << endl;
        cout << "Среднее Cc - OStime: " << avgCc_OStime << endl;
        cout << "Глобальное время NTP: " << globalServerTime << endl;
        cout << "Разница с глобальным временем: " << (globalServerTime - localTime) << endl;
        cout << "========================================" << endl;

        this_thread::sleep_for(chrono::milliseconds(requestInterval));
    }

    cout << "Достигнуто максимальное количество запросов. Клиент завершает работу." << endl;
    cleanup();
}

int main() {
    setlocale(LC_ALL, "Russian");
    WSADATA wsaData;
    sockaddr_in serverAddr;

    cout << "Введите интервал запросов (мс): ";
    cin >> requestInterval;
    cout << "Введите максимальное количество запросов: ";
    cin >> maxRequests;


    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        cout << "Ошибка инициализации Winsock" << endl;
        return 1;
    }

    clientSocket = socket(AF_INET, SOCK_DGRAM, 0);
    if (clientSocket == INVALID_SOCKET) {
        cleanup();
        return 1;
    }

    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = inet_addr("127.0.0.1");
    serverAddr.sin_port = htons(3000);

    thread globalTimeThread(update_global_time);
    thread localTimeThread(update_local_time_from_server, serverAddr);

    localTimeThread.join();
    isClientRunning = false;
    globalTimeThread.join();

    cout << "Клиент завершил работу." << endl;
    return 0;
}
