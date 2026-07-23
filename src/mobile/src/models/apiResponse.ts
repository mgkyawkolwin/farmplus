
export default interface ApiResponse<T>{
    success: string;
    message?: string;
    data?: T;
}