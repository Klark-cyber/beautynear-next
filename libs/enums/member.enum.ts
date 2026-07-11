export enum MemberType {
	USER = 'USER',
	AGENT = 'AGENT',
	ADMIN = 'ADMIN',
}


export enum MemberStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE', // BLOCK o'rniga — platformaga kirmagan yoki tasdiqlash kutayotgan
	PAUSE = 'PAUSE',       // vaqtincha to'xtatilgan (agent o'zi yoki admin tomonidan)
	DELETE = 'DELETE',
}


// ⚠️ YANGI — Agent bo'lish so'rovlari uchun (Admin panelda ko'rib chiqish)
export enum AgentRequestStatus {
	NONE = 'NONE',
	PENDING = 'PENDING',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED',
}


export enum MemberAuthType {
	PHONE = 'PHONE',
	EMAIL = 'EMAIL',
	KAKAO = 'KAKAO',  // TELEGRAM o'rniga — Koreya bozori uchun
	NAVER = 'NAVER',  // yangi — Koreya bozori uchun
}
