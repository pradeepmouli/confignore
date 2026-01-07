/**
 * Pino logger configured to write to the Confignore OutputChannel.
 */

import * as vscode from 'vscode';
import pino, { DestinationStream, LoggerOptions } from 'pino';

const channel = vscode.window.createOutputChannel('Confignore');

const destination: DestinationStream = {
  write(msg: string): void {
    channel.append(msg);
  }
};

const options: LoggerOptions = {
  name: 'confignore',
  level: 'info',
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime
};

const logger = pino(options, destination);

export function getLogger() {
  return logger;
}

export function getOutputChannel() {
  return channel;
}
