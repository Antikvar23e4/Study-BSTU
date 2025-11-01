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
double avgCorrection = 0.0;
double avgCc_OStime = 0.0;
int requestInterval;
int maxRequests;
const char* ntpServer = "pool.ntp.org";
bool stopClient = false;

time_t GetLocalTime() {
    SYSTEMTIME st;
    FILETIME ft;
    ULARGE_INTEGER ui;

    GetSystemTime(&st);
    SystemTimeToFileTime(&st, &ft);
    ui.LowPart = ft.dwLowDateTime;
    ui.HighPart = ft.dwHighDateTime;

    return (time_t)((ui.QuadPart / 10000000ULL) - 11644473600ULL); // Unix из Windows-времени
}

void SetSystemTime(time_t newTime) {
    SYSTEMTIME st;
    FILETIME ft;
    ULARGE_INTEGER ui;

    ui.QuadPart = (newTime + 11644473600ULL) * 10000000ULL;//Unix в Windows-время
    ft.dwLowDateTime = ui.LowPart;
    ft.dwHighDateTime = ui.HighPart;

    FileTimeToSystemTime(&ft, &st);

    if (SetSystemTime(&st)) { //устанавливает время в формате UTC
        cout << "Системное время успешно установлено: "
            << st.wYear << "-" << st.wMonth << "-" << st.wDay << " "
            << st.wHour << ":" << st.wMinute << ":" << st.wSecond << endl;
    }
    else {
        cout << "Ошибка установки системного времени!" << endl;
    }
}


time_t GetNPT() {
    SOCKET sock;
    sockaddr_in ntpAddr;
    NTPPacket packet = {};
    packet.li_vn_mode = 0x1B;

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

    unsigned long ntpTime = ntohl(packet.txTm_s) - 2208988800U;
    return (time_t)ntpTime;
}


void UpdTime() {
    while (!stopClient) {
        time_t newTime = GetNPT();
        lock_guard<mutex> lock(timeMutex);
        globalServerTime = newTime;
        cout << "Глобальное время NTP: " << globalServerTime << endl;
        this_thread::sleep_for(chrono::milliseconds(requestInterval));
    }
}


void ConnectToServer(SOCKET clientSocket, sockaddr_in serverAddr) {
    int requestCount = 0;

    while (requestCount < maxRequests && !stopClient) {
        time_t localTime = GetLocalTime();
        GETSINCHRO sendData;
        sendData.curvalue = static_cast<int>(localTime);
        strcpy(sendData.cmd, "REQ");

        sendto(clientSocket, (char*)&sendData, sizeof(sendData), 0, (sockaddr*)&serverAddr, sizeof(serverAddr));

        SETSINCHRO recvData;
        int serverAddrSize = sizeof(serverAddr);
        recvfrom(clientSocket, (char*)&recvData, sizeof(recvData), 0, (sockaddr*)&serverAddr, &serverAddrSize);

        int correction = recvData.correction;
        time_t newTime = localTime + correction;
        SetSystemTime(newTime);

        requestCount++;
        if (requestCount > 1) {
            avgCorrection += (correction - avgCorrection) / requestCount;
            time_t localNtpDiff = globalServerTime - localTime;
            avgCc_OStime += (localNtpDiff - avgCc_OStime) / requestCount;
            if (requestCount >= maxRequests) {
                stopClient = true;
            }
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

    cout << "Достигнут максимальный лимит запросов. Клиент завершает работу." << std::endl;
}

int main() {
    setlocale(LC_ALL, "Russian");
    WSADATA wsaData;
    SOCKET clientSocket;
    sockaddr_in serverAddr;

    cout << "Введите интервал запросов (мс): ";
    cin >> requestInterval;
    cout << "Введите максимальное количество запросов: ";
    cin >> maxRequests;

    WSAStartup(MAKEWORD(2, 2), &wsaData);
    clientSocket = socket(AF_INET, SOCK_DGRAM, 0);

    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = inet_addr("127.0.0.1");
    serverAddr.sin_port = htons(3000);

    thread globalTimeThread(UpdTime);
    globalTimeThread.detach();

    thread localTimeThread(ConnectToServer, clientSocket, serverAddr); 
    localTimeThread.detach();

    this_thread::sleep_for(chrono::hours(1)); 

    closesocket(clientSocket);
    WSACleanup();
    return 0;
}
