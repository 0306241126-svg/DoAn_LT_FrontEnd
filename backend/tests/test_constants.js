// backend/tests/test_utils.js
const path = require('path');
const fs = require('fs/promises');

// Trỏ từ backend/tests -> backend/src/utils/
const { readJson, atomicWriteJson } = require('../src/utils/fileHelper');
const { createSlug } = require('../src/utils/slugify');

async function runTests() {
  console.log('====== BẮT ĐẦU KIỂM THỬ UTILS ======\n');

  // 1. Kiểm tra hàm createSlug
  console.log('1. Kiểm tra hàm createSlug:');
  const testInput = 'Đồ án';
  const expectedSlug = 'do-an';
  const actualSlug = createSlug(testInput);

  console.log(`- Đầu vào: "${testInput}"`);
  console.log(`- Kết quả: "${actualSlug}"`);

  if (actualSlug === expectedSlug) {
    console.log('=> KẾT QUẢ createSlug: ĐẠT CHUẨN ✅\n');
  } else {
    console.error(`=> KẾT QUẢ createSlug: THẤT BẠI ❌\n`);
  }

  // 2. Kiểm tra hàm atomicWriteJson & readJson
  console.log('2. Kiểm tra hàm atomicWriteJson & readJson:');
  // Trỏ file test tạm vào backend/data/test_sample.json
  const testFilePath = path.join(__dirname, '../data/test_sample.json');
  const mockData = {
    testId: 101,
    title: 'Ghi chú thử nghiệm',
    createdAt: new Date().toISOString()
  };

  try {
    await atomicWriteJson(testFilePath, mockData);
    console.log('- Ghi file tạm thành công.');

    const readData = await readJson(testFilePath);
    console.log('- Đọc lại file thành công:', readData);

    if (readData.testId === mockData.testId && readData.title === mockData.title) {
      console.log('=> KẾT QUẢ atomicWriteJson & readJson: ĐẠT CHUẨN ✅\n');
    }

    // Dọn dẹp file test
    await fs.unlink(testFilePath);
    console.log('- Đã dọn dẹp file tạm.');
  } catch (error) {
    console.error('=> LỖI KIỂM THỬ ❌:', error);
  }

  console.log('\n====== KẾT THÚC KIỂM THỬ ======');
}

runTests();