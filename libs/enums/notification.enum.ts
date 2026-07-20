// ⚠️ MUHIM: bu — FRONTEND uchun oddiy TypeScript enum (hech qanday
// NestJS/@nestjs/graphql importisiz). Agar shu joyda "@nestjs/graphql"
// importi haqida xato korsangiz — bu Backend faylining tasodifan shu
// yerga saqlanganini bildiradi, shu faylni ustidan yozing.

export enum NotificationType {
	FOLLOW = 'FOLLOW',
	LIKE = 'LIKE',
	COMMENT = 'COMMENT',
	BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
	BOOKING_CANCELLED = 'BOOKING_CANCELLED',
	NEW_POST = 'NEW_POST',
	DISCOUNT = 'DISCOUNT',
	FREE_SLOT = 'FREE_SLOT',
	NEW_REVIEW = 'NEW_REVIEW',
	NEW_BOOKING = 'NEW_BOOKING',
	ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
	AGENT_APPROVED = 'AGENT_APPROVED',
	NEW_INQUIRY = 'NEW_INQUIRY',
	NEW_AGENT_REQUEST = 'NEW_AGENT_REQUEST',
	NEW_MESSAGE = 'NEW_MESSAGE',
}

export enum NotificationStatus {
	WAIT = 'WAIT',
	READ = 'READ',
}

export enum NotificationGroup {
	MEMBER = 'MEMBER',
	SALON = 'SALON',
	SERVICE = 'SERVICE',
	BOOKING = 'BOOKING',
	ARTICLE = 'ARTICLE',
}