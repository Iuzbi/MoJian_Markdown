const fs = require("node:fs");
const path = require("node:path");

let activeLogFilePath = null;
let loggingEnabled = isEnvironmentLoggingEnabled();

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

function resolveBaseDirectory(app) {
  if (app && !app.isPackaged) {
    return process.cwd();
  }

  try {
    const executablePath = typeof app?.getPath === "function" ? app.getPath("exe") : process.execPath;
    return path.dirname(executablePath);
  } catch {
    return process.cwd();
  }
}

function resolveLogDirectory(app) {
  return path.join(resolveBaseDirectory(app), "logs");
}

function isEnvironmentLoggingEnabled() {
  const value = String(process.env.MOJIAN_ENABLE_LOGGING || "").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
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

function getLogStatus(app) {
  return {
    enabled: loggingEnabled,
    logFilePath: activeLogFilePath,
    logDirectory: resolveLogDirectory(app)
  };
}

function enableLogging(app, reason = "manual", resetSession = false) {
  if (resetSession) {
    activeLogFilePath = null;
  }

  loggingEnabled = true;
  const targetPath = ensureLogFile(app);
  const details = reason ? { reason } : undefined;
  const line = `${createLineTimestamp()} [INFO] [logger] log capture enabled${serializeDetails(details)}\n`;
  fs.appendFileSync(targetPath, line, "utf8");
  return getLogStatus(app);
}

function disableLogging(app, reason = "manual") {
  if (loggingEnabled && activeLogFilePath) {
    const details = reason ? { reason } : undefined;
    const line = `${createLineTimestamp()} [INFO] [logger] log capture stopped${serializeDetails(details)}\n`;
    fs.appendFileSync(activeLogFilePath, line, "utf8");
  }

  loggingEnabled = false;
  return getLogStatus(app);
}

function writeLog(app, level, scope, message, details) {
  if (!loggingEnabled) {
    return null;
  }

  const targetPath = ensureLogFile(app);
  const line = `${createLineTimestamp()} [${level}] [${scope}] ${message}${serializeDetails(details)}\n`;
  fs.appendFileSync(targetPath, line, "utf8");
  return targetPath;
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
  disableLogging,
  enableLogging,
  ensureLogFile,
  getLogDirectory: resolveLogDirectory,
  getLogFilePath: () => activeLogFilePath,
  getLogStatus,
  installProcessLogging,
  isLoggingEnabled: () => loggingEnabled,
  logError,
  logInfo,
  logWarn
};
