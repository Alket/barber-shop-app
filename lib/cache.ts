type CacheEntry<T> = {
  data: T
  expiresAt: number
}

class SimpleCache {
  private store = new Map<string, Map<string, CacheEntry<any>>>()

  get<T>(namespace: string, key: string): T | undefined {
    const ns = this.store.get(namespace)
    if (!ns) return undefined
    const entry = ns.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      ns.delete(key)
      return undefined
    }
    return entry.data as T
  }

  set<T>(namespace: string, key: string, data: T, ttlMs: number): void {
    let ns = this.store.get(namespace)
    if (!ns) {
      ns = new Map<string, CacheEntry<any>>()
      this.store.set(namespace, ns)
    }
    ns.set(key, { data, expiresAt: Date.now() + ttlMs })
  }

  clearNamespace(namespace: string): void {
    this.store.delete(namespace)
  }

  clearAll(): void {
    this.store.clear()
  }
}

export const cache = new SimpleCache()

export const CACHE_TTL = {
  reservations: 30_000, // 30s
  clients: 60_000,      // 60s
  settings: 300_000,    // 5m
}


