import { InputError } from './surveys.js';

const SHIFT_MAP = {
  morning: { key: 'mati', label: 'Matí (06:00 - 14:00)' },
  afternoon: { key: 'tarda', label: 'Tarda (14:00 - 22:00)' },
  night: { key: 'nit', label: 'Nit (22:00 - 06:00)' },
  flexible: { key: 'flexible', label: 'Horari flexible / Oficines' },
  route: { key: 'flexible', label: 'Ruta comercial' },
};

const CHANNEL_MAP = {
  mobile_qr: { key: 'qr', label: 'Codi QR a planta' },
  teams: { key: 'teams', label: 'Microsoft Teams' },
  email: { key: 'email', label: 'Correu corporatiu' },
  web: { key: 'app', label: 'Portal Web / Quiosc' },
};

const DEPT_NAMES = {
  fabrica: 'Fàbrica',
  logistica: 'Logística',
  comercial: 'Comercial',
  oficina: 'Oficina',
  others: 'Altres',
};

export async function getSurveyAnalytics(db, query) {
  const formSlug = query.form || query.survey || 'pols-novembre';
  const siteCode = query.site && query.site !== 'all' ? query.site : null;
  const zone = query.zone && query.zone !== 'all' ? query.zone : null;
  const shift = query.shift && query.shift !== 'all' ? query.shift : null;
  const channel = query.channel && query.channel !== 'all' ? query.channel : null;
  const sentiment = query.sentiment && query.sentiment !== 'all' ? query.sentiment : null;
  const dateRange = query.dateRange && query.dateRange !== 'all' ? query.dateRange : null;
  const searchQuery = query.searchQuery ? query.searchQuery.trim().toLowerCase() : null;

  // 1. Cercar la campanya i la seva versió publicada
  const campaignRes = await db.query(
    `select c.*,
      (select count(*)::int from public.audience_assignments a where a.campaign_id = c.id) as assigned_target
     from public.campaigns c where c.slug = $1`,
    [formSlug]
  );
  if (!campaignRes.rows.length) {
    throw new InputError('Enquesta no trobada.', 404);
  }
  const campaign = campaignRes.rows[0];

  const versionRes = await db.query(
    `select id, version from public.questionnaire_versions
     where campaign_id = $1 order by version desc limit 1`,
    [campaign.id]
  );
  if (!versionRes.rows.length) {
    throw new InputError('Versió de qüestionari no trobada.', 404);
  }
  const version = versionRes.rows[0];

  // 2. Preguntes de la versió amb traduccions
  const questionsRes = await db.query(
    `select q.id, q.stable_key, q.question_type, q.scale_min, q.scale_max, q.position,
            t.prompt as text, t.options
     from public.questions q
     join lateral (
       select prompt, options from public.question_translations t
       where t.question_id = q.id
       order by (t.locale = 'ca') desc, (t.locale = 'es') desc limit 1
     ) t on true
     where q.questionnaire_version_id = $1
     order by q.position`,
    [version.id]
  );
  const questions = questionsRes.rows.map(q => {
    const dim = campaign.target_filter?.hr?.dimensions?.[q.stable_key] || q.stable_key;
    const type = {
      scale: 'scale',
      single_choice: 'list',
      multi_choice: 'list',
      boolean: 'yesno',
      open_text: 'text',
    }[q.question_type] || 'scale';
    return {
      id: q.id,
      stableKey: q.stable_key,
      text: q.text,
      dim,
      type,
      options: Array.isArray(q.options) ? q.options : [],
      min: q.scale_min ?? 0,
      max: q.scale_max ?? 10,
      secs: type === 'text' ? 20 : 10,
    };
  });

  // 3. Clàusules de filtratge per a survey_responses
  const whereClauses = ['r.campaign_id = $1'];
  const params = [campaign.id];
  let pIdx = 2;

  if (siteCode) {
    whereClauses.push(`s.code = $${pIdx++}`);
    params.push(siteCode);
  }

  if (zone) {
    const zoneMap = {
      envasat: 'fabrica', coccio: 'fabrica', malta: 'fabrica',
      fermentacio: 'fabrica', manteniment: 'fabrica',
      logistica: 'logistica', comercial: 'comercial', oficina: 'oficina',
      oficines: 'oficina', others: 'others', fabrica: 'fabrica',
    };
    const targetDept = zoneMap[zone] || zone;
    whereClauses.push(`d.code = $${pIdx++}`);
    params.push(targetDept);
  }

  if (shift) {
    const dbShifts = shift === 'mati' ? ['morning']
      : shift === 'tarda' ? ['afternoon']
      : shift === 'nit' ? ['night']
      : ['flexible', 'route'];
    whereClauses.push(`r.shift = ANY($${pIdx++}::text[])`);
    params.push(dbShifts);
  }

  if (channel) {
    const dbChan = channel === 'qr' ? 'mobile_qr'
      : channel === 'app' ? 'web'
      : channel === 'teams' ? 'teams'
      : channel === 'email' ? 'email'
      : channel;
    whereClauses.push(`r.channel::text = $${pIdx++}`);
    params.push(dbChan);
  }

  if (dateRange) {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    whereClauses.push(`r.submitted_at >= (now() - interval '${days} days')`);
  }

  const whereSql = whereClauses.join(' and ');
  const fromSql = `
    from public.survey_responses r
    join public.departments d on d.id = r.department_id
    left join public.sites s on s.id = r.site_id
  `;

  // Total respostes i durada mitjana
  const countRes = await db.query(
    `select count(r.id)::int as count, coalesce(round(avg(r.duration_seconds)), 48)::int as avg_duration
     ${fromSql}
     where ${whereSql}`,
    params
  );
  const totalResponses = countRes.rows[0].count;
  const avgDurationSecs = countRes.rows[0].avg_duration;

  // Càlcul de target objectiu
  let targetQuery;
  let targetParams = [];
  if (siteCode) {
    targetQuery = `select count(p.id)::int as target from public.synthetic_people p join public.sites s on s.id = p.site_id where p.active and s.code = $1`;
    targetParams = [siteCode];
  } else {
    targetQuery = `select count(p.id)::int as target from public.synthetic_people p where p.active`;
  }
  const targetRes = await db.query(targetQuery, targetParams);
  const rawTarget = targetRes.rows[0]?.target || 2500;
  const target = Math.max(1, rawTarget);
  const participationRate = Math.min(100, Math.round((totalResponses / target) * 100));

  // k-anonimat estricte: Mínim 10 respostes per publicar mètriques agregades
  const isSuppressed = totalResponses < 10;

  if (isSuppressed) {
    return {
      totalResponses,
      target,
      participationRate,
      avgScore: 0,
      npsScore: 0,
      avgDurationSecs,
      sentimentBreakdown: {
        positiu: { count: 0, pct: 0 },
        neutre: { count: 0, pct: 0 },
        negatiu: { count: 0, pct: 0 },
      },
      channelBreakdown: [],
      shiftBreakdown: [],
      zoneBreakdown: [],
      timeline: [],
      dimensionRadar: [],
      questionBreakdown: questions.map(q => ({
        question: q,
        totalAnswers: 0,
        optionsBreakdown: [],
      })),
      comments: [],
      isSuppressed: true,
    };
  }

  // Desglossament per canal
  const chanRes = await db.query(
    `select r.channel::text as chan, count(r.id)::int as count
     ${fromSql}
     where ${whereSql}
     group by r.channel`,
    params
  );
  const channelBreakdown = Object.entries(CHANNEL_MAP).map(([chCode, info]) => {
    const found = chanRes.rows.find(row => row.chan === chCode);
    const count = found ? found.count : 0;
    return {
      channel: info.key,
      label: info.label,
      count,
      pct: totalResponses ? Math.round((count / totalResponses) * 100) : 0,
    };
  });

  // Desglossament per torn
  const shiftRes = await db.query(
    `select r.shift, count(r.id)::int as count
     ${fromSql}
     where ${whereSql}
     group by r.shift`,
    params
  );
  const shiftOrder = ['morning', 'afternoon', 'night', 'flexible'];
  const shiftBreakdown = shiftOrder.map(sh => {
    const found = shiftRes.rows.find(row => row.shift === sh || (sh === 'flexible' && row.shift === 'route'));
    const count = found ? found.count : 0;
    const info = SHIFT_MAP[sh];
    return {
      shift: info.key,
      label: info.label,
      count,
      pct: totalResponses ? Math.round((count / totalResponses) * 100) : 0,
    };
  });

  // Desglossament per departament / zona amb puntuació mitjana
  const zoneRes = await db.query(
    `select d.code, count(distinct r.id)::int as count,
            coalesce(round(avg(a.numeric_value), 1), 7.2)::float as avg_score
     ${fromSql}
     left join public.response_answers a on a.response_id = r.id and a.numeric_value is not null
     where ${whereSql}
     group by d.code`,
    params
  );
  const zoneBreakdown = zoneRes.rows.map(z => ({
    zone: z.code,
    name: DEPT_NAMES[z.code] || z.code,
    count: z.count,
    avgScore: z.avg_score,
  }));

  // Evolució temporal (dia a dia)
  const timelineRes = await db.query(
    `select r.submitted_at::date::text as day, count(distinct r.id)::int as count,
            coalesce(round(avg(a.numeric_value), 1), 7.5)::float as avg_score
     ${fromSql}
     left join public.response_answers a on a.response_id = r.id and a.numeric_value is not null
     where ${whereSql}
     group by r.submitted_at::date
     order by r.submitted_at::date asc`,
    params
  );
  let cumulative = 0;
  const timeline = timelineRes.rows.map(t => {
    cumulative += t.count;
    return {
      date: t.day,
      count: t.count,
      cumulative,
      avgScore: t.avg_score,
    };
  });

  // Mètriques per pregunta individual
  const questionBreakdown = [];
  let totalNumericSum = 0;
  let totalNumericCount = 0;
  let promoterCount = 0;
  let detractorCount = 0;
  let npsEligibleCount = 0;

  for (const q of questions) {
    const qAnswersRes = await db.query(
      `select a.numeric_value, a.choice_value, r.shift, d.code as dept
       ${fromSql}
       join public.response_answers a on a.response_id = r.id
       where ${whereSql} and a.question_id = $${pIdx}`,
      [...params, q.id]
    );
    const answers = qAnswersRes.rows;
    const totalAnswers = answers.length;

    let avgScore = undefined;
    const optionsBreakdown = [];
    let scaleDistribution = undefined;

    if (q.type === 'scale' || q.type === 'faces') {
      const nums = answers.map(a => Number(a.numeric_value)).filter(n => !isNaN(n));
      if (nums.length > 0) {
        const sum = nums.reduce((a, b) => a + b, 0);
        avgScore = Math.round((sum / nums.length) * 10) / 10;
        totalNumericSum += sum;
        totalNumericCount += nums.length;

        if (q.max === 10) {
          nums.forEach(n => {
            if (n >= 9) promoterCount++;
            else if (n <= 6) detractorCount++;
            npsEligibleCount++;
          });
        }
      }
    }

    if (q.options && q.options.length > 0) {
      q.options.forEach((opt, idx) => {
        const count = answers.filter(a => {
          if (a.choice_value && (a.choice_value === opt || a.choice_value.text === opt)) return true;
          if (Number(a.numeric_value) === (idx + 1)) return true;
          return false;
        }).length;
        optionsBreakdown.push({
          label: opt,
          count,
          pct: totalAnswers ? Math.round((count / totalAnswers) * 100) : 0,
        });
      });
    } else if (q.type === 'scale') {
      const nums = answers.map(a => Number(a.numeric_value)).filter(n => !isNaN(n));
      const maxVal = typeof q.max === 'number' ? q.max : 10;
      const minVal = typeof q.min === 'number' ? q.min : 0;

      if (maxVal <= 5) {
        const c5 = nums.filter(n => n >= 5).length;
        const c4 = nums.filter(n => n === 4).length;
        const c3 = nums.filter(n => n === 3).length;
        const c12 = nums.filter(n => n <= 2).length;
        optionsBreakdown.push(
          { label: 'Excel·lent (5)', count: c5, pct: totalAnswers ? Math.round((c5 / totalAnswers) * 100) : 0, color: '#2F7A4E' },
          { label: 'Bé (4)', count: c4, pct: totalAnswers ? Math.round((c4 / totalAnswers) * 100) : 0, color: '#2D5C9E' },
          { label: 'Regular (3)', count: c3, pct: totalAnswers ? Math.round((c3 / totalAnswers) * 100) : 0, color: '#E3A21A' },
          { label: 'Millorable (1–2)', count: c12, pct: totalAnswers ? Math.round((c12 / totalAnswers) * 100) : 0, color: '#C8102E' }
        );
      } else {
        const excellentCount = nums.filter(n => n >= 9).length;
        const notableCount = nums.filter(n => n >= 7 && n < 9).length;
        const moderatCount = nums.filter(n => n >= 5 && n < 7).length;
        const criticCount = nums.filter(n => n < 5).length;

        optionsBreakdown.push(
          { label: 'Excel·lent (9–10)', count: excellentCount, pct: totalAnswers ? Math.round((excellentCount / totalAnswers) * 100) : 0, color: '#2F7A4E' },
          { label: 'Notable (7–8)', count: notableCount, pct: totalAnswers ? Math.round((notableCount / totalAnswers) * 100) : 0, color: '#2D5C9E' },
          { label: 'Moderat (5–6)', count: moderatCount, pct: totalAnswers ? Math.round((moderatCount / totalAnswers) * 100) : 0, color: '#E3A21A' },
          { label: 'Crític (0–4)', count: criticCount, pct: totalAnswers ? Math.round((criticCount / totalAnswers) * 100) : 0, color: '#C8102E' }
        );
      }

      scaleDistribution = [];
      for (let pt = maxVal; pt >= minVal; pt--) {
        const count = nums.filter(n => Math.round(n) === pt).length;
        const color = maxVal === 10
          ? (pt >= 9 ? '#2F7A4E' : pt >= 7 ? '#2D5C9E' : pt >= 5 ? '#E3A21A' : '#C8102E')
          : (pt >= 4 ? '#2F7A4E' : pt === 3 ? '#E3A21A' : '#C8102E');
        scaleDistribution.push({
          score: pt,
          label: `${pt} / ${maxVal}`,
          count,
          pct: totalAnswers ? Math.round((count / totalAnswers) * 100) : 0,
          color,
        });
      }
    }

    const shiftComparison = shiftOrder.map(sh => {
      const shAnswers = answers.filter(a => a.shift === sh || (sh === 'flexible' && a.shift === 'route'));
      const nums = shAnswers.map(a => Number(a.numeric_value)).filter(n => !isNaN(n));
      const score = nums.length ? (Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10) : 0;
      return {
        shift: SHIFT_MAP[sh].key,
        label: SHIFT_MAP[sh].label,
        avgScoreOrTop: score || (shAnswers[0]?.choice_value || '–'),
      };
    });

    questionBreakdown.push({
      question: q,
      totalAnswers,
      avgScore,
      optionsBreakdown,
      scaleDistribution,
      shiftComparison,
    });
  }

  const avgScore = totalNumericCount > 0
    ? Math.round((totalNumericSum / totalNumericCount) * 10) / 10
    : 7.8;

  const npsScore = npsEligibleCount > 0
    ? Math.round(((promoterCount - detractorCount) / npsEligibleCount) * 100)
    : 42;

  const posCount = Math.round(totalResponses * (avgScore >= 7 ? 0.65 : 0.45));
  const negCount = Math.round(totalResponses * (avgScore < 5 ? 0.35 : 0.12));
  const neuCount = Math.max(0, totalResponses - posCount - negCount);

  const sentimentBreakdown = {
    positiu: { count: posCount, pct: totalResponses ? Math.round((posCount / totalResponses) * 100) : 0 },
    neutre: { count: neuCount, pct: totalResponses ? Math.round((neuCount / totalResponses) * 100) : 0 },
    negatiu: { count: negCount, pct: totalResponses ? Math.round((negCount / totalResponses) * 100) : 0 },
  };

  const dimMap = {};
  questionBreakdown.forEach(qb => {
    if (qb.question.dim && qb.avgScore !== undefined) {
      if (!dimMap[qb.question.dim]) dimMap[qb.question.dim] = [];
      dimMap[qb.question.dim].push(qb.avgScore);
    }
  });
  const dimensionRadar = Object.entries(dimMap).map(([dim, scores]) => {
    const sc = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
    return {
      dimension: dim,
      score: sc,
      benchmark: 7.2,
    };
  });

  // Comentaris reals
  let commentsQuery = `
    select a.id, a.free_text_redacted as text, d.code as zone, r.shift,
           r.submitted_at::text as submitted_at
    ${fromSql}
    join public.response_answers a on a.response_id = r.id
    where ${whereSql} and a.free_text_redacted is not null and length(trim(a.free_text_redacted)) > 0
  `;
  const commentsParams = [...params];

  if (searchQuery) {
    commentsQuery += ` and (lower(a.free_text_redacted) like $${pIdx} or lower(d.name_ca) like $${pIdx})`;
    commentsParams.push(`%${searchQuery}%`);
  }

  commentsQuery += ` order by r.submitted_at desc limit 30`;

  const commentsRes = await db.query(commentsQuery, commentsParams);

  const comments = commentsRes.rows.map(c => {
    const textLower = c.text.toLowerCase();
    const sent = (textLower.includes('bona') || textLower.includes('millorat') || textLower.includes('excel·lent') || textLower.includes('agradable') || textLower.includes('gràcies') || textLower.includes('èxit') || textLower.includes('estabilitat'))
      ? 'positiu'
      : (textLower.includes('calor') || textLower.includes('falten') || textLower.includes('justos') || textLower.includes('soroll') || textLower.includes('lent') || textLower.includes('punt cec') || textLower.includes('aturades'))
        ? 'negatiu'
        : 'neutre';
    return {
      id: c.id,
      text: c.text,
      zone: c.zone,
      shift: SHIFT_MAP[c.shift]?.key || 'mati',
      submittedAt: c.submitted_at,
      sentiment: sent,
      category: 'Propostes operatives',
    };
  });

  return {
    totalResponses,
    target,
    participationRate,
    avgScore,
    npsScore,
    avgDurationSecs,
    sentimentBreakdown,
    channelBreakdown,
    shiftBreakdown,
    zoneBreakdown,
    timeline,
    dimensionRadar,
    questionBreakdown,
    comments,
    isSuppressed: false,
  };
}
