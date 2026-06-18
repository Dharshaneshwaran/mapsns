import { Injectable } from "@nestjs/common";

type Subscription = {
  endpoint: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

@Injectable()
export class NotificationsService {
  private readonly subscriptions: Subscription[] = [];
  private readonly history: Array<{ title: string; body: string; createdAt: string }> =
    [];

  subscribe(subscription: Subscription) {
    this.subscriptions.push(subscription);
    return {
      success: true,
      subscriptions: this.subscriptions.length,
    };
  }

  notify(title: string, body: string) {
    const record = { title, body, createdAt: new Date().toISOString() };
    this.history.unshift(record);
    return {
      delivered: this.subscriptions.length,
      record,
    };
  }

  recent() {
    return this.history;
  }
}

