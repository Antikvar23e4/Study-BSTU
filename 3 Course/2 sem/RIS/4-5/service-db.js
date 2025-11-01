const T_SUB_InitialData = [
  {
    ACT: "1",
    SUB: "GO_CNTR",
    SUB_NAME: "ГО Центр",
    SUB_ADR: "http://localhost:3000",
    WITH_PROXY: "N",
    SUB_PORT: "3000",
    SUB_PROXY: null,
    SUB_PATH: "/",
    SUB_PROXY_PORT: null,
  },
  {
    ACT: "1",
    SUB: "T01REG",
    SUB_NAME: "ТО Регион 1",
    SUB_ADR: "http://localhost:3001",
    WITH_PROXY: "N",
    SUB_PORT: "3001",
    SUB_PROXY: null,
    SUB_PATH: "/",
    SUB_PROXY_PORT: null,
  },
  {
    ACT: "1",
    SUB: "T02REG",
    SUB_NAME: "ТО Регион 2",
    SUB_ADR: "http://localhost:3002",
    WITH_PROXY: "N",
    SUB_PORT: "3002",
    SUB_PROXY: null,
    SUB_PATH: "/",
    SUB_PROXY_PORT: null,
  },
  {
    ACT: "0",
    SUB: "T03DIS",
    SUB_NAME: "ТО Отключен",
    SUB_ADR: "http://localhost:3003",
    WITH_PROXY: "N",
    SUB_PORT: "3003",
    SUB_PROXY: null,
    SUB_PATH: "/",
    SUB_PROXY_PORT: null,
  },
];

const T_IST_InitialData = [
  { IST: "101", PERIOD: "5", ED: "s", DT_BEG: "00", DT_END: "00" },
];

module.exports = { T_SUB_InitialData, T_IST_InitialData };
