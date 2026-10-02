import fs from 'node:fs';
import path from 'node:path';
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

type Entry = { id: string; requisito: string; caso: string; estado: 'APROBADO' | 'FALLIDO' | 'BLOQUEADO'; duracionMs: number; detalle: string };

class ResumenReporter implements Reporter {
  private entries: Entry[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    const id = test.title.match(/\bCP-\d{2}\b/)?.[0] || 'SIN-ID';
    const requisito = test.title.match(/\bRF-T\d{2}\b/)?.[0] || 'SIN-RF';
    const blocked = result.status === 'skipped' && test.annotations.some(a => a.type === 'BLOQUEADO' || (a.description || '').startsWith('BLOQUEADO:'));
    const estado = blocked ? 'BLOQUEADO' : result.status === 'passed' ? 'APROBADO' : 'FALLIDO';
    const detalle = blocked
      ? test.annotations.find(a => a.type === 'BLOQUEADO')?.description || 'Precondición ausente'
      : result.error?.message?.split('\n')[0] || '';
    this.entries.push({ id, requisito, caso: test.title, estado, duracionMs: result.duration, detalle });
  }

  onEnd(): void {
    const output = path.resolve('reports');
    fs.mkdirSync(output, { recursive: true });
    const summary = {
      ejecucion: process.env.SAT_RUN_ID || '',
      fecha: new Date().toISOString(),
      total: this.entries.length,
      aprobados: this.entries.filter(e => e.estado === 'APROBADO').length,
      fallidos: this.entries.filter(e => e.estado === 'FALLIDO').length,
      bloqueados: this.entries.filter(e => e.estado === 'BLOQUEADO').length,
      casos: this.entries
    };
    fs.writeFileSync(path.join(output, 'resumen.json'), JSON.stringify(summary, null, 2), 'utf8');
    const safe = (value: string) => value.replaceAll('|', '\\|').replaceAll('\n', ' ');
    const lines = [
      '# Resultado de las pruebas SAT Panambí',
      '',
      `Ejecución: ${summary.ejecucion}`,
      '',
      `Aprobados: ${summary.aprobados} · Fallidos: ${summary.fallidos} · Bloqueados: ${summary.bloqueados}`,
      '',
      '| Caso | Requisito | Estado | Duración | Detalle |',
      '| --- | --- | --- | ---: | --- |',
      ...this.entries.map(e => `| ${e.id} | ${e.requisito} | ${e.estado} | ${(e.duracionMs / 1000).toFixed(1)} s | ${safe(e.detalle)} |`),
      ''
    ];
    fs.writeFileSync(path.join(output, 'resumen.md'), lines.join('\n'), 'utf8');
  }
}

export default ResumenReporter;
