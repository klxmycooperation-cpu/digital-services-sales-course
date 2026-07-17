import { deepFreeze } from './factory.mjs';

const checkedAt = '2026-07-15';
const videoTitle = 'ИИШНЫЙ — «Изучил ВЕСЬ маркетинг ярдовых ИИ-стартапов. Это можно повторить»';
const videoUrl = 'https://www.youtube.com/watch?v=7KDYQ3fC-v8';
const source = (title, url, type, usage, metadata = {}) => deepFreeze({
  title,
  url,
  checkedAt,
  type,
  usage,
  ...metadata,
});

export const videoEvidence = deepFreeze({
  'video-changed-process': {
    id: 'video-changed-process',
    mechanism: 'changed-ability-process',
    summary: 'Маркетинг показывает изменившуюся способность пользователя и рабочий процесс, а не технологическую метку.',
    timestampWindows: ['02:19-03:18', '12:36-13:55'],
    sourceUrl: videoUrl,
  },
  'video-fast-result': {
    id: 'video-fast-result',
    mechanism: 'fast-first-visible-result',
    summary: 'Первый опыт быстро доводит пользователя до видимого результата вместо долгого объяснения продукта.',
    timestampWindows: ['07:07-07:40', '13:05-14:08'],
    sourceUrl: videoUrl,
  },
  'video-transformation-demo': {
    id: 'video-transformation-demo',
    mechanism: 'transformation-demo',
    summary: 'Демонстрации и короткие tutorials показывают переход от исходного состояния к новому результату.',
    timestampWindows: ['04:18-04:58', '12:36-12:45'],
    sourceUrl: videoUrl,
  },
  'video-referral-loop': {
    id: 'video-referral-loop',
    mechanism: 'share-referral-loop',
    summary: 'Результат проектируется так, чтобы им было естественно поделиться и запустить рекомендацию.',
    timestampWindows: ['05:00-06:13', '10:43-11:05'],
    sourceUrl: videoUrl,
  },
  'video-founder-led': {
    id: 'video-founder-led',
    mechanism: 'founder-led-transparency-manual-onboarding',
    summary: 'Основатель показывает процесс открыто, строит публично и вручную сопровождает первые внедрения.',
    timestampWindows: ['07:47-08:16', '14:42-15:00', '15:58-16:05'],
    sourceUrl: videoUrl,
  },
});

export const videoSource = (...evidenceIds) => source(
  videoTitle,
  videoUrl,
  'case',
  'Используется только как кейс-наблюдение по указанным evidence IDs и timestamp windows; без числовых заявлений о выручке или оценке.',
  { evidenceIds },
);

export const SOURCES = deepFreeze({
  discovery: source(
    'How the discovery phase works — GOV.UK Service Manual',
    'https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works',
    'official',
    'Подтверждает работу через исходную проблему, границы, допущения и проверяемый следующий этап.',
  ),
  userNeeds: source(
    'Learning about users and their needs — GOV.UK Service Manual',
    'https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs',
    'official',
    'Поддерживает фокус на наблюдаемой потребности и реальном пользовательском процессе, а не на функции.',
  ),
  measurement: source(
    'Measuring the success of your service — GOV.UK Service Manual',
    'https://www.gov.uk/service-manual/measuring-success/measuring-the-success-of-your-service',
    'official',
    'Поддерживает заранее заданные критерии результата и измерение изменения процесса.',
  ),
  market: source(
    'Market research and competitive analysis — U.S. Small Business Administration',
    'https://www.sba.gov/business-guide/plan-your-business/market-research-competitive-analysis',
    'official',
    'Поддерживает проверяемую сегментацию, исследование спроса и ограниченные рыночные гипотезы.',
  ),
  spin: source(
    'The Science Behind SPIN Selling — Huthwaite International',
    'https://www.huthwaiteinternational.com/hubfs/Whitepapers%20-%202025/Whitepaper%20PDFs/The%20Science%20behind%20SPIN%20Selling.pdf',
    'method',
    'Используется для вопросов о ситуации, проблеме, последствиях и ценности изменения.',
  ),
  bant: source(
    'Budget Authority Need Timeframe (BANT) Criteria Template — IBM',
    'https://public.dhe.ibm.com/software/pdf/tr/SAMPLE-BANT_for_XYZ_Company_1JF-XXXXXX.pdf',
    'method',
    'Используется как источник вопросов о бюджете, полномочиях, потребности и сроке, без механического скоринга.',
  ),
  meddpicc: source(
    'MEDDIC / MEDDPICC Sales Methodology and Process',
    'https://meddicc.com/meddpicc-sales-methodology-and-process',
    'method',
    'Поддерживает проверку процесса решения, участников, критериев и следующего обязательства.',
  ),
  objections: source(
    'The art of handling customer objections in sales — Huthwaite International',
    'https://www.huthwaiteinternational.com/blog/handling-customer-objections',
    'method',
    'Поддерживает уточнение причины возражения до ответа и обмен уступки на встречное условие.',
  ),
  tender: source(
    'Software Licence Agreements, Applications and Associated Services Framework — Find a Tender',
    'https://www.find-tender.service.gov.uk/Notice/021807-2025',
    'official',
    'Даёт пример формальной закупочной структуры; не используется как универсальный шаблон договора или КП.',
  ),
  ruAdvertising: source(
    'Федеральный закон от 13.03.2006 № 38-ФЗ «О рекламе» — Правительство России',
    'https://government.ru/docs/all/98086/',
    'law',
    'Фиксирует необходимость отдельно проверять допустимость рекламной коммуникации в России.',
  ),
  ruPrivacy: source(
    'Роскомнадзор: персональные данные для юридических лиц',
    'https://82.rkn.gov.ru/directions/pers/p15375/',
    'official',
    'Поддерживает осторожную работу с контактными данными и проверку основания обработки.',
  ),
  belarusAdvertising: source(
    'Закон Республики Беларусь № 225-З «О рекламе» — Национальный правовой интернет-портал',
    'https://etalonline.by/document/?regnum=H10700225',
    'law',
    'Показывает, почему российские правила нельзя автоматически переносить на контакты в Беларуси.',
  ),
  telegram: source(
    'Telegram Spam FAQ',
    'https://telegram.org/faq_spam',
    'policy',
    'Подтверждает риск ограничений за нежелательные сообщения и необходимость прекращать нерелевантные касания.',
  ),
  linkedin: source(
    'LinkedIn Professional Community Policies',
    'https://www.linkedin.com/legal/professional-community-policies',
    'policy',
    'Подтверждает запрет нерелевантных, нежелательных и повторяющихся коммерческих сообщений.',
  ),
  whatsapp: source(
    'WhatsApp Business Messaging Policy',
    'https://whatsappbusiness.com/policy/',
    'policy',
    'Поддерживает требования opt-in, уважения отказа и правил инициируемой бизнесом коммуникации.',
  ),
  eprivacy: source(
    'Directive 2002/58/EC, Article 13 — EUR-Lex',
    'https://eur-lex.europa.eu/eli/dir/2002/58/2009-12-19/eng',
    'law',
    'Подтверждает, что email-маркетинг в ЕС требует проверки страны, адресата, основания и способа отказа.',
  ),
  ftc: source(
    'CAN-SPAM Act: A Compliance Guide for Business — FTC',
    'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business',
    'law',
    'Поддерживает требования к коммерческому email в США, включая точность отправителя и рабочий opt-out.',
  ),
});
