import { PrismaClient, Prisma } from '@prisma/client';

export interface SearchFilters {
  urgency?: string[];
  impact?: string[];
  type?: string;
  status?: string[];
  from?: Date;
  to?: Date;
  channelId?: string;
  includeThreads?: boolean;
  limit: number;
  offset: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
}

export interface IncidentSearchResult {
  incidents: any[];
  total: number;
}

export interface MessageSearchResult {
  messages: any[];
  total: number;
}

export interface SearchSuggestion {
  term: string;
  count: number;
}

/**
 * 全文検索API
 */
export function createSearchApi(prisma: PrismaClient) {
  /**
   * 検索クエリを日本語のts_queryに変換
   */
  const toTsQuery = (query: string): string => {
    // スペースで分割して、各単語をOR検索
    const words = query.trim().split(/\s+/);
    return words.map(word => `'${word}'`).join(' | ');
  };

  return {
    /**
     * インシデントの全文検索
     */
    async searchIncidents(
      query: string,
      filters: Partial<SearchFilters>
    ): Promise<IncidentSearchResult> {
      const tsQuery = toTsQuery(query);
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;

      // WHERE条件の構築
      const conditions: string[] = [];
      const params: any[] = [tsQuery];
      let paramIndex = 2;

      if (filters.urgency && filters.urgency.length > 0) {
        conditions.push(`i.urgency = ANY($${paramIndex}::text[])`);
        params.push(filters.urgency);
        paramIndex++;
      }

      if (filters.impact && filters.impact.length > 0) {
        conditions.push(`i.impact = ANY($${paramIndex}::text[])`);
        params.push(filters.impact);
        paramIndex++;
      }

      if (filters.type) {
        conditions.push(`i.type = $${paramIndex}`);
        params.push(filters.type);
        paramIndex++;
      }

      if (filters.status && filters.status.length > 0) {
        conditions.push(`i.status = ANY($${paramIndex}::text[])`);
        params.push(filters.status);
        paramIndex++;
      }

      if (filters.from) {
        conditions.push(`i."createdAt" >= $${paramIndex}`);
        params.push(filters.from);
        paramIndex++;
      }

      if (filters.to) {
        conditions.push(`i."createdAt" <= $${paramIndex}`);
        params.push(filters.to);
        paramIndex++;
      }

      if (filters.channelId) {
        conditions.push(`i."channelId" = $${paramIndex}`);
        params.push(filters.channelId);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 
        ? `AND ${conditions.join(' AND ')}`
        : '';

      // メインクエリ
      const searchQuery = `
        SELECT 
          i.id,
          i.title,
          i.description,
          i.urgency,
          i.impact,
          i.type,
          i.status,
          i.assignee,
          i.notes,
          i."createdAt",
          i."updatedAt",
          i."urgencyManual",
          i."impactManual",
          c.id as "channel.id",
          c.name as "channel.name",
          c."slackChannelId" as "channel.slackChannelId",
          m.id as "message.id",
          m."slackTs" as "message.slackTs",
          m.raw as "message.raw",
          ts_rank_cd(isv.search_vector, to_tsquery('japanese', $1)) as "searchRank"
        FROM incident_search_view isv
        JOIN "Incident" i ON i.id = isv.id
        JOIN "Channel" c ON i."channelId" = c.id
        LEFT JOIN "SlackMessage" m ON i."messageId" = m.id
        WHERE isv.search_vector @@ to_tsquery('japanese', $1)
        ${whereClause}
        ORDER BY "searchRank" DESC, i."createdAt" DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      // 検索実行
      const results = await prisma.$queryRawUnsafe(searchQuery, ...params);

      // 結果の整形
      const incidents = ((results || []) as any[]).map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        urgency: row.urgency,
        impact: row.impact,
        type: row.type,
        status: row.status,
        assignee: row.assignee,
        notes: row.notes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        urgencyManual: row.urgencyManual,
        impactManual: row.impactManual,
        channel: {
          id: row['channel.id'],
          name: row['channel.name'],
          slackChannelId: row['channel.slackChannelId'],
        },
        message: row['message.id'] ? {
          id: row['message.id'],
          slackTs: row['message.slackTs'],
          raw: row['message.raw'],
        } : null,
        searchRank: parseFloat(row.searchRank),
      }));

      // 合計件数の取得
      const countQuery = `
        SELECT COUNT(*) as count
        FROM incident_search_view isv
        JOIN "Incident" i ON i.id = isv.id
        WHERE isv.search_vector @@ to_tsquery('japanese', $1)
        ${whereClause}
      `;

      const countParams = params.slice(0, -2); // limit, offsetを除く
      const countResult = await prisma.$queryRawUnsafe(countQuery, ...countParams);
      const total = parseInt((((countResult || []) as any[])[0] || { count: '0' }).count);

      return {
        incidents,
        total,
      };
    },

    /**
     * Slackメッセージの全文検索
     */
    async searchMessages(
      query: string,
      filters: {
        channelId?: string;
        from?: Date;
        to?: Date;
        limit: number;
        offset: number;
      }
    ): Promise<MessageSearchResult> {
      const tsQuery = toTsQuery(query);
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;

      // WHERE条件の構築
      const conditions: string[] = [];
      const params: any[] = [tsQuery];
      let paramIndex = 2;

      if (filters.channelId) {
        conditions.push(`m."channelId" = $${paramIndex}`);
        params.push(filters.channelId);
        paramIndex++;
      }

      if (filters.from) {
        conditions.push(`m."createdAt" >= $${paramIndex}`);
        params.push(filters.from);
        paramIndex++;
      }

      if (filters.to) {
        conditions.push(`m."createdAt" <= $${paramIndex}`);
        params.push(filters.to);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 
        ? `AND ${conditions.join(' AND ')}`
        : '';

      // メインクエリ
      const searchQuery = `
        SELECT 
          m.id,
          m."slackTs",
          m."channelId",
          m.raw,
          m."createdAt",
          c.id as "channel.id",
          c.name as "channel.name",
          c."slackChannelId" as "channel.slackChannelId",
          ts_rank_cd(m.search_vector, to_tsquery('japanese', $1)) as "searchRank"
        FROM "SlackMessage" m
        JOIN "Channel" c ON m."channelId" = c.id
        WHERE m.search_vector @@ to_tsquery('japanese', $1)
        ${whereClause}
        ORDER BY "searchRank" DESC, m."createdAt" DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      // 検索実行
      const results = await prisma.$queryRawUnsafe(searchQuery, ...params);

      // 結果の整形
      const messages = ((results || []) as any[]).map(row => ({
        id: row.id,
        slackTs: row.slackTs,
        channelId: row.channelId,
        raw: row.raw,
        createdAt: row.createdAt,
        channel: {
          id: row['channel.id'],
          name: row['channel.name'],
          slackChannelId: row['channel.slackChannelId'],
        },
        searchRank: parseFloat(row.searchRank),
      }));

      // 合計件数の取得
      const countQuery = `
        SELECT COUNT(*) as count
        FROM "SlackMessage" m
        WHERE m.search_vector @@ to_tsquery('japanese', $1)
        ${whereClause}
      `;

      const countParams = params.slice(0, -2); // limit, offsetを除く
      const countResult = await prisma.$queryRawUnsafe(countQuery, ...countParams);
      const total = parseInt((((countResult || []) as any[])[0] || { count: '0' }).count);

      return {
        messages,
        total,
      };
    },

    /**
     * 検索候補の取得
     */
    async getSuggestions(query: string): Promise<SearchSuggestion[]> {
      // 3文字未満は候補を返さない
      if (query.length < 3) {
        return [];
      }

      const suggestionQuery = `
        SELECT 
          phrase,
          COUNT(*) as count
        FROM (
          SELECT 
            regexp_split_to_table(
              lower(COALESCE(raw->>'text', '')), 
              '\\s+'
            ) as phrase
          FROM "SlackMessage"
        ) words
        WHERE phrase LIKE $1
        GROUP BY phrase
        ORDER BY count DESC
        LIMIT 10
      `;

      const results = await prisma.$queryRawUnsafe(
        suggestionQuery, `${query}%`
      );

      return ((results || []) as any[]).map(row => ({
        term: row.phrase,
        count: parseInt(row.count),
      }));
    },

    /**
     * 検索インデックスの更新
     */
    async updateSearchIndex(messageId?: string): Promise<{ updated: number }> {
      if (messageId) {
        // 特定のメッセージのインデックスを更新
        const updateQuery = `
          UPDATE "SlackMessage"
          SET search_vector = to_tsvector('japanese', COALESCE(raw->>'text', ''))
          WHERE id = $1
        `;

        const result = await prisma.$executeRawUnsafe(
          updateQuery, messageId
        );

        return { updated: result };
      } else {
        // 全メッセージのインデックスを更新
        const updateQuery = `
          UPDATE "SlackMessage"
          SET search_vector = to_tsvector('japanese', COALESCE(raw->>'text', ''))
        `;

        const result = await prisma.$executeRawUnsafe(updateQuery);

        return { updated: result };
      }
    },
  };
}
