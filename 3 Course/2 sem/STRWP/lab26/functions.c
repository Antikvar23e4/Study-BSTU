// functions.c
#include <emscripten.h>

EMSCRIPTEN_KEEPALIVE
int sum(int x, int y) {
  return x + y;
}

EMSCRIPTEN_KEEPALIVE
int mul(int x, int y) {
  return x * y;
}

EMSCRIPTEN_KEEPALIVE
int sub(int x, int y) {
  return x - y;
}