export default class CustomError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'CustomError';
    
    // Maintains proper stack trace for where the error was thrown
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}