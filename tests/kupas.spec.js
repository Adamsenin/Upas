// @ts-check
import { test, expect } from '@playwright/test';

test.describe('KUPAS E2E Core Tests', () => {

  // ==========================================
  // Beranda (index.html)
  // ==========================================
  test('beranda memuat dengan judul yang benar', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/KUPAS/i);
    const heading = page.locator('#judul-beranda, h1').filter({ hasText: 'Jelajahi Pulau Ekosistem' }).first();
    await expect(heading).toBeVisible();
  });

  test('tombol Siswa tersedia di beranda', async ({ page }) => {
    await page.goto('/');
    const tombolSiswa = page.locator('#tab-peran-siswa');
    await expect(tombolSiswa).toBeVisible();
    await expect(tombolSiswa).toContainText(/siswa/i);
  });

  test('tombol Guru tersedia di beranda', async ({ page }) => {
    await page.goto('/');
    const tombolGuru = page.locator('#tab-peran-guru');
    await expect(tombolGuru).toBeVisible();
    await expect(tombolGuru).toContainText(/guru/i);
  });

  // ==========================================
  // Navigasi
  // ==========================================
  test('klik Guru mengarah ke halaman login guru', async ({ page }) => {
    await page.goto('/');
    // Beralih ke peran Guru dan klik tombol portal guru
    await page.locator('#tab-peran-guru').click();
    const btnGuru = page.locator('#btn-saya-guru');
    await expect(btnGuru).toBeVisible();
    await btnGuru.click();
    await expect(page).toHaveURL(/.*guru.*/);
  });

  test('halaman 404 tampil saat URL salah', async ({ page }) => {
    const response = await page.goto('/tidak-ada.html');
    expect(response?.status()).toBe(404);
    const isErrorVisible = await page.getByText(/404|not found|cannot get|tidak ditemukan/i).first().isVisible().catch(() => false);
    expect(isErrorVisible).toBe(true);
  });

  // ==========================================
  // Halaman lain
  // ==========================================
  test('duel-tim.html memuat tanpa error', async ({ page }) => {
    const response = await page.goto('/duel-tim.html');
    expect(response?.status()).toBe(200);
    const content = page.locator('.duel-judul, main').first();
    await expect(content).toBeVisible();
  });

  test('adventure.html memuat tanpa error', async ({ page }) => {
    const response = await page.goto('/adventure.html');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Adventure/i);
    const canvasOrHeading = page.locator('#gameCanvas, .result-title, canvas').first();
    await expect(canvasOrHeading).toBeVisible();
  });

  test('guru/dasbor.html memuat tanpa error', async ({ page }) => {
    const response = await page.goto('/guru/dasbor.html');
    expect(response?.status()).toBe(200);
    const content = page.locator('main').first();
    await expect(content).toBeVisible();
  });

});
