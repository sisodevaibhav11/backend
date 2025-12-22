class ApiResponse {
  constructor({ statusCode = 200, message = "Success", data = null }) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.statusCode >= 200 && this.statusCode < 300 ? (this.success = true) : (this.success = false);   
  } }   