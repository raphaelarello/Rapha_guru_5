import { gerarAnaliseAoVivoReal } from './server/pro/live-ia-analyzer.ts';

async function main() {
  const res = await gerarAnaliseAoVivoReal();
  console.log(JSON.stringify(res, null, 2));
}

main();
