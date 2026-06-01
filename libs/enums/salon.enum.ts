export enum SalonType {
	HAIR = 'HAIR',
	NAIL = 'NAIL',
	SKIN = 'SKIN',
	CLINIC = 'CLINIC',
	MASSAGE = 'MASSAGE',
}

export enum SalonStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	PAUSE = 'PAUSE',
	DELETE = 'DELETE',
}

export enum SalonLocation {
	ALL = 'ALL',        // butun mamlakat bo'ylab (filter da ishlatiladi, DB ga saqlanmaydi)
	SEOUL = 'SEOUL',
	BUSAN = 'BUSAN',
	DAEGU = 'DAEGU',
	INCHEON = 'INCHEON',
	JEJU = 'JEJU',
	GANGWON = 'GANGWON',
}