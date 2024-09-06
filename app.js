const { Telegraf } = require("telegraf");
const command = require("./utils/commands");

const botToken = "7347220264:AAE2T8IACl7ChyzUD0_XSTUY3bZjdzWLaTM";
//const botToken = "5490432130:AAHzX4M2X7Sp95UqtMaVe4ngKVetNeMFAyc";

const bot = new Telegraf(botToken);

const PORT = 3000;

command.command(bot);

bot.launch();
