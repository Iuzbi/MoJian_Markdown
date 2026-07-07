const fs = require("node:fs");
const path = require("node:path");

let activeLogFilePath = null;

function pad(value) {
  return String(value).padStart(2, "0");
}

function createFileTimestamp(date = new Date()) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-") + "_" + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join("-");
}

function createLineTimestamp(date = new Date()) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-") + " " + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join(":") + "." + String(date.getMilliseconds()).padStart(3, "0");
}

function resolveLogDirectory() {
  return path.join("E:\\Desktop", "MoJian_Debug_Logs");
}

function serializeDetails(details) {
  if (details === undefined) {
    return "";
  }

  try {
    return ` ${JSON.stringify(details, null, 0)}`;
  } catch {
    return ` ${String(details)}`;
  }
}

function ensureLogFile(app) {
  if (activeLogFilePath) {
    return activeLogFilePath;
  }

  const directory = resolveLogDirectory(app);
  fs.mkdirSync(directory, { recursive: true });
  activeLogFilePath = path.join(directory, `session-${createFileTimestamp()}.log`);
  fs.appendFileSync(activeLogFilePath, `${createLineTimestamp()} [INFO] [logger] log file created\n`, "utf8");
  return activeLogFilePath;
}

function writeLog(app, level, scope, message, details) {
  const targetPath = ensureLogFile(app);
  const line = `${createLineTimestamp()} [${level}] [${scope}] ${message}${serializeDetails(details)}\n`;
  fs.appendFileSync(targetPath, line, "utf8");
}

function logInfo(app, scope, message, details) {
  writeLog(app, "INFO", scope, message, details);
}

function logWarn(app, scope, message, details) {
  writeLog(app, "WARN", scope, message, details);
}

function logError(app, scope, message, details) {
  writeLog(app, "ERROR", scope, message, details);
}

function installProcessLogging(app, scope) {
  process.on("uncaughtException", (error) => {
    logError(app, scope, "uncaughtException", {
      message: error?.message,
      stack: error?.stack
    });
  });

  process.on("unhandledRejection", (reason) => {
    logError(app, scope, "unhandledRejection", {
      reason: reason instanceof Error ? { message: reason.message, stack: reason.stack } : reason
    });
  });
}

module.exports = {
  ensureLogFile,
  getLogFilePath: () => activeLogFilePath,
  installProcessLogging,
  logError,
  logInfo,
  logWarn
};
