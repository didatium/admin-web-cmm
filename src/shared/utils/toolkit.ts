

function ConvertTime(item: any) {
	const currentTime = new Date(item);

	// Lấy offset (độ lệch) múi giờ của máy tính địa phương so với UTC
	const localOffset = currentTime.getTimezoneOffset();

	// Tính toán offset (độ lệch) múi giờ từ GMT+0 đến GMT+7 (7 * 60 phút)
	const offsetGMT7 = 7 * 60;

	// Tính toán timestamp mới cho thời gian theo múi giờ GMT+7
	const timestampGMT7 = currentTime.getTime() + localOffset * 60 * 1000 + offsetGMT7 * 60 * 1000;

	// Tạo một đối tượng Date mới từ timestamp đã tính toán
	const date = new Date(timestampGMT7);

	return date;
}

function FormatDate(item: any) {
	const formatter = new Intl.DateTimeFormat('vi-VN', {
		weekday: 'long',     // Ngày trong tuần, ví dụ: Thứ Hai
		year: 'numeric',     // Năm, ví dụ: 2023
		month: 'long',       // Tháng, ví dụ: Tháng Tám
		day: 'numeric',      // Ngày trong tháng, ví dụ: 2
	});

	const date = new Date(item);
	return formatter.format(date);
}

function CombineConvert(item: any) {
	const currentTime = new Date(item);

	const formatter = new Intl.DateTimeFormat('vi-VN', {
		weekday: 'long',     // Ngày trong tuần, ví dụ: Thứ Hai
		year: 'numeric',     // Năm, ví dụ: 2023
		month: 'long',       // Tháng, ví dụ: Tháng Tám
		day: 'numeric',      // Ngày trong tháng, ví dụ: 2
		hour: 'numeric',     // Giờ, ví dụ: 14
		minute: 'numeric',   // Phút, ví dụ: 30
		second: 'numeric',   // Giây, ví dụ: 45'
	});

	// Lấy offset (độ lệch) múi giờ của máy tính địa phương so với UTC
	const localOffset = currentTime.getTimezoneOffset();

	// Tính toán offset (độ lệch) múi giờ từ GMT+0 đến GMT+7 (7 * 60 phút)
	const offsetGMT7 = 7 * 60;

	// Tính toán timestamp mới cho thời gian theo múi giờ GMT+7
	const timestampGMT7 = currentTime.getTime() + localOffset * 60 * 1000 + offsetGMT7 * 60 * 1000;

	// Tạo một đối tượng Date mới từ timestamp đã tính toán
	const date = new Date(timestampGMT7);
	return formatter.format(date);
}

function getCleanDate(date = new Date()) {
	date = new Date(date)
	const dd = String(date.getDate()).padStart(2, '0');
	const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
	const yyyy = date.getFullYear();

	return `${dd}-${mm}-${yyyy}`;
}

export { ConvertTime, FormatDate, CombineConvert, getCleanDate };