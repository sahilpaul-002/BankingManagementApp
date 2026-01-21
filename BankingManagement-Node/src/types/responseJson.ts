export interface responseStatus {
    status: string;
}

export interface responseMessage {
    message: string;
}

export interface badRequestResponseJson extends responseStatus , responseMessage {}; 
export interface responseJson extends responseStatus, responseMessage {};