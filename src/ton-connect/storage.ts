import { IStorage } from '@tonconnect/sdk'

const storage = new Map<string, string>()

export class TonConnectStorage implements IStorage {
  constructor(private readonly chatId: number) {}

  private getKey(key: string): string {
    return this.chatId.toString() + key
  }

  async removeItem(key: string): Promise<void> {
    storage.delete(this.getKey(key))
  }

  async setItem(key: string, value: string): Promise<void> {
    storage.set(this.getKey(key), value)
  }

  async getItem(key: string): Promise<string | null> {
    return storage.get(this.getKey(key)) || null
  }
}
