export class ValidationError extends Error {
  constructor(public details: string[], message = "Validación fallida") {
    super(message);
    this.name = "ValidationError";
  }
}