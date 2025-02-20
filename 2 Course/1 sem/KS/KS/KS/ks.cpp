#include <iostream>
using namespace std;

#include <winsock2.h>
#include <iphlpapi.h>
#include <icmpapi.h>
#include <sstream>
#pragma comment(lib, "iphlpapi.lib")
#pragma comment(lib, "ws2_32.lib")

#pragma warning(disable:4996)
#define IP_STATUS_BASE 11000
#define IP_SUCCESS 0
#define IP_DEST_NET_UNREACHABLE 11002
#define IP_DEST_HOST_UNREACHABLE 11003
#define IP_DEST_PROT_UNREACHABLE 11004
#define IP_DEST_PORT_UNREACHABLE 11005
#define IP_REQ_TIMED_OUT 11010
#define IP_BAD_REQ 11011
#define IP_BAD_ROUTE 11012
#define IP_TTL_EXPIRED_TRANSIT 11013
IP_OPTION_INFORMATION option = { 255, 255, 240, 0, 0 };

// The first parameter is the host address to be pinged,
// the second is the timeout for response (in ms) after the request,
// and the third is the number of requests to be sent
void Ping(const char* cHost, unsigned int Timeout, unsigned int RequestCount)
{
    // Create a service file
    HANDLE hIP = IcmpCreateFile();
    if (hIP == INVALID_HANDLE_VALUE)
    {
        WSACleanup();
        return;
    }

    char SendData[32] = "Data for ping";     // Buffer for transmission
    int LostPacketsCount = 0;                // Number of lost packets
    unsigned int MaxMS = 0;                  // Maximum response time (ms)
    int MinMS = -1;                          // Minimum response time (ms)
    // Allocate memory for the packet - response buffer
    PICMP_ECHO_REPLY pIpe =
        (PICMP_ECHO_REPLY)GlobalAlloc(GHND,
            sizeof(ICMP_ECHO_REPLY)
            + sizeof(SendData));
    if (pIpe == 0) {
        IcmpCloseHandle(hIP);
        WSACleanup();
        return;
    }
    pIpe->Data = SendData;
    pIpe->DataSize = sizeof(SendData);
    unsigned long ipaddr = inet_addr(cHost);

    for (unsigned int c = 0; c < RequestCount; c++)
    {
        int dwStatus = IcmpSendEcho(hIP,
            ipaddr,
            SendData,
            sizeof(SendData),
            &option,
            pIpe,
            sizeof(ICMP_ECHO_REPLY) +
            sizeof(SendData),
            Timeout);
        if (dwStatus > 0)
        {
            for (int i = 0; i < dwStatus; i++)
            {
                unsigned char* pIpPtr =
                    (unsigned char*)&pIpe->Address;
                cout << " " << (int)*(pIpPtr)
                    << "." << (int)*(pIpPtr + 1)
                    << "." << (int)*(pIpPtr + 2)
                    << "." << (int)*(pIpPtr + 3)
                    << ": bytes = " << pIpe->DataSize
                    << " time = " << pIpe->RoundTripTime
                    << "ms TTL = " << (int)pIpe->Options.Ttl;
                MaxMS = (MaxMS > pIpe->RoundTripTime) ?
                    MaxMS : pIpe->RoundTripTime;
                MinMS = (MinMS < (int)pIpe->RoundTripTime
                    && MinMS >= 0) ?
                    MinMS : pIpe->RoundTripTime;
                cout << endl;
            }
        }
        else
        {
            if (pIpe->Status)
            {
                LostPacketsCount++;
                switch (pIpe->Status)
                {
                case IP_DEST_NET_UNREACHABLE:
                case IP_DEST_HOST_UNREACHABLE:
                case IP_DEST_PROT_UNREACHABLE:
                case IP_DEST_PORT_UNREACHABLE:
                    cout << "Remote host may be down." << endl;
                    break;
                case IP_REQ_TIMED_OUT:
                    cout << "Request timed out." << endl;
                    break;
                case IP_TTL_EXPIRED_TRANSIT:
                    cout << "TTL expired in transit." << endl;
                    break;
                default:
                    cout << "Error code: %ld"
                        << pIpe->Status << endl;
                    break;
                }
            }
        }
    }

    IcmpCloseHandle(hIP);
    WSACleanup();

    if (MinMS < 0) MinMS = 0;
    unsigned char* pByte = (unsigned char*)&pIpe->Address;
    cout << "Ping Statistics "
        << (int)*(pByte)
        << "." << (int)*(pByte + 1)
        << "." << (int)*(pByte + 2)
        << "." << (int)*(pByte + 3) << endl;
    cout << "\tPackets: Sent = " << RequestCount
        << ", Received = "
        << RequestCount - LostPacketsCount
        << ", Lost = " << LostPacketsCount
        << "<" << (int)(100 / (float)RequestCount) *
        LostPacketsCount
        << " % loss>, " << endl;
    cout << "Approximate round trip times:"
        << endl << "Minimum = " << MinMS
        << "ms, Maximum = " << MaxMS
        << "ms, Average = " << (MaxMS + MinMS) / 2
        << "ms" << endl;
}

int main(int argc, char** argv)
{
    setlocale(LC_ALL, "EN");
    const char* par0 = argv[1];
    int par1 = atoi(argv[2]);
    int par2 = atoi(argv[3]);
    Ping(par0, par1, par2);
    return 0;
}
