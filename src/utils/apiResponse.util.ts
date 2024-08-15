//? boilerplate for API Response
export class ApiResponse {
  statusCode;
  message;
  data;
  success;
  constructor(statusCode: number, message = "Success", data: any = {}) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.success = statusCode < 400;
  }
}
