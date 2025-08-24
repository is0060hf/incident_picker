import { RuleInput, RuleRecord } from '../domain/rules';

export class InMemoryRulesRepository {
  private rules: RuleRecord[] = [];

  async list(): Promise<RuleRecord[]> {
    return [...this.rules];
  }

  async create(input: RuleInput): Promise<RuleRecord> {
    // 正規表現の妥当性チェック
    try {
      // eslint-disable-next-line no-new
      new RegExp(input.pattern);
    } catch (e) {
      throw new Error('Invalid regex pattern');
    }
    const now = new Date().toISOString();
    const rec: RuleRecord = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...input,
    };
    this.rules.push(rec);
    return rec;
  }

  async update(id: string, partial: Partial<RuleInput>): Promise<RuleRecord> {
    const idx = this.rules.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Not found');
    if (partial.pattern !== undefined) {
      try {
        // eslint-disable-next-line no-new
        new RegExp(partial.pattern);
      } catch (e) {
        throw new Error('Invalid regex pattern');
      }
    }
    const updated: RuleRecord = {
      ...this.rules[idx],
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    this.rules[idx] = updated;
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.rules = this.rules.filter(r => r.id !== id);
  }
}
