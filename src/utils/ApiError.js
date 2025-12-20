class ApiError extends Error {
  constructor(message="something went wrong", statusCode,error=[]  ,statck="") {
    super(message);
    this.statusCode = statusCode;
    this.data=null;
    this.success=false;
    this.message=message;
    this.errors=this.error;
    if(statck){
        this.stack=statck
    }else{
        Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };