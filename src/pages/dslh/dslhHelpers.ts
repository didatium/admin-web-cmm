export function getKhoiLop(tenLop: string | undefined | null): number | null {
  if (!tenLop) return null;
  const match = tenLop.toString().match(/\d+/);
  if (match) {
    const khoi = parseInt(match[0], 10);
    if (khoi >= 1 && khoi <= 12) {
      return khoi;
    }
  }
  return null;
}

export function generatePassword(): string {
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}

export function makeClass(names: string[]) {
  return names
    .filter(Boolean)
    .map((value) => {
      const clean = value.replace(/^(lớp|lop|class|cls)\s*/i, '').trim();
      return {
        class_id: 'cls' + clean,
        class_name: 'Lớp ' + clean,
        grade: getKhoiLop(clean),
      };
    });
}

export function makeUser(names: string[]) {
  return names
    .filter(Boolean)
    .map((value) => {
      const clean = value.replace(/^(lớp|lop|class|cls)\s*/i, '').trim();
      return {
        user_id: 'ur' + clean,
        user_class: 'cls' + clean,
        user_name: 'sdl' + clean,
        password: generatePassword(),
        role: 'sao_do',
      };
    });
}

export function makeAdmin(grade: number | string) {
  return {
    user_id: 'adm' + grade,
    user_name: 'admin' + grade,
    password: generatePassword(),
    role: 'admin_khoi',
    grade_scope: Number(grade),
  };
}
