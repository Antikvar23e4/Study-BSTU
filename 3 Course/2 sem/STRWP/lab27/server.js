const axios = require("axios");

const BOT_TOKEN = "7953648204:AAG6-sKQgWB1Z12RCzHzUeu8NR7bkBrnlWA";
const TELEGRAM_API_BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;
let offset = 0;

async function getUpdates() {
  try {
    console.log(
      `[${new Date().toLocaleTimeString()}] Polling for updates with offset: ${offset}...`
    );
    const response = await axios.get(`${TELEGRAM_API_BASE_URL}/getUpdates`, {
      params: {
        offset: offset,
        limit: 100,
        timeout: 30,
      },
      timeout: 35000,
    });

    if (response.data && response.data.ok && response.data.result) {
      return response.data.result;
    } else {
      console.error("Error in getUpdates response:", response.data);
      return [];
    }
  } catch (error) {
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      console.log(
        `[${new Date().toLocaleTimeString()}] Long poll timeout, no new messages.`
      );
    } else {
      console.error(
        `[${new Date().toLocaleTimeString()}] Error fetching updates:`,
        error.message
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    return [];
  }
}

async function sendMessage(chatId, text) {
  try {
    console.log(
      `[${new Date().toLocaleTimeString()}] Sending message to chat ${chatId}: "${text}"`
    );
    const response = await axios.post(`${TELEGRAM_API_BASE_URL}/sendMessage`, {
      chat_id: chatId,
      text: text,
    });

    if (response.data && response.data.ok) {
      console.log(
        `[${new Date().toLocaleTimeString()}] Message sent successfully.`
      );
    } else {
      console.error("Error sending message:", response.data);
    }
  } catch (error) {
    console.error(
      `[${new Date().toLocaleTimeString()}] Error in sendMessage:`,
      error.message
    );
  }
}

async function startBot() {
  if (BOT_TOKEN === "YOUR_TELEGRAM_BOT_TOKEN") {
    console.error("Неверный токен");
    return;
  }
  console.log("Telegram Echo Bot (27-01) started...");
  console.log("Send a message to your bot in Telegram.");

  while (true) {
    const updates = await getUpdates();

    if (updates.length > 0) {
      for (const update of updates) {
        if (update.message && update.message.text) {
          const chatId = update.message.chat.id;
          const receivedText = update.message.text;
          const userName =
            update.message.from.username || update.message.from.first_name;

          console.log(
            `[${new Date().toLocaleTimeString()}] Received message from ${userName} (chatId: ${chatId}): "${receivedText}"`
          );

          const echoText = `echo: ${receivedText}`;
          await sendMessage(chatId, echoText);
        }
        offset = update.update_id + 1;
      }
    }
  }
}

startBot();
