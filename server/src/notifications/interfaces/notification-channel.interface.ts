export interface INotificationChannel {
  send(recipient: string, payload: any): Promise<void>;
}
