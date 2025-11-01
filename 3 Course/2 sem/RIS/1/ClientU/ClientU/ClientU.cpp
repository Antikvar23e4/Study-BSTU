#include <iostream>
#include "Winsock2.h"
#include <string>
#include <ctime>
#include <thread> 
#include <chrono> 
#pragma comment(lib, "WS2_32.lib")
#pragma warning(disable: 4996)

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

int main() {
    setlocale(LC_ALL, "Russian");
    WSADATA wsaData;
    SOCKET cC;
    SOCKADDR_IN servAddr;
    int port = 2000;
    //
    GETSINCHRO getSinchro;
    SETSINCHRO setSinchro;
    int Cc = 0, firstCorrection = 0;
    sockaddr_in from;
    int fromlen = sizeof(from);

    cout << "Введите задержку между запросами (мс): ";
    int delay;
    cin >> delay;

    cout << "Введите количество запросов: ";
    int requests_number;
    cin >> requests_number;

    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        throw "Ошибка при вызове WSAStartup";
    }
    cout << "Winsock библиотека инициализирована." << endl;

    if ((cC = socket(AF_INET, SOCK_DGRAM, 0)) == INVALID_SOCKET) {
        throw "Ошибка при создании сокета";
    }
    cout << "Сокет создан." << endl;

    servAddr.sin_family = AF_INET;
    servAddr.sin_port = htons(port);
    servAddr.sin_addr.s_addr = inet_addr("127.0.0.1"); // IP 
   
    cout << "Клиентское приложение запущено." << endl;

    getSinchro.curvalue = 0;
    sendto(cC, (char*)&getSinchro, sizeof(getSinchro), 0, (sockaddr*)&servAddr, sizeof(servAddr));

    recvfrom(cC, (char*)&setSinchro, sizeof(setSinchro), 0, (sockaddr*)&from, &fromlen);
    firstCorrection = setSinchro.correction;
    Cc += firstCorrection + delay;

    cout << "========================================" << endl;
    cout << "Первоначальная коррекция: " << firstCorrection << endl;
    cout << "Начальное значение Cc(время клиента): " << Cc << endl;
    cout << "========================================" << endl;


    this_thread::sleep_for(chrono::milliseconds(delay));

    for (int i = 0; i < requests_number; i++) {
        strcpy(getSinchro.cmd, "REQ");
        getSinchro.curvalue = Cc;
        sendto(cC, (char*)&getSinchro, sizeof(getSinchro), 0, (sockaddr*)&servAddr, sizeof(servAddr));

        recvfrom(cC, (char*)&setSinchro, sizeof(setSinchro), 0, (sockaddr*)&from, &fromlen);
        Cc += setSinchro.correction + delay; //

        cout << "----------------------------------------" << endl;
        cout << "Запрос #" << (i + 1) << endl;
        cout << "Коррекция: " << setSinchro.correction << endl;
        cout << "Новое Cc: " << Cc << endl;
        cout << "----------------------------------------" << endl;


        this_thread::sleep_for(chrono::milliseconds(delay));
    }

    cout << "Все запросы выполнены. Нажмите Enter для выхода..." << endl;
    cin.get();

    closesocket(cC);
    WSACleanup();
    return 0;
}