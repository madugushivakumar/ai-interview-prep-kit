import fs from 'fs';
import path from 'path';
import { runInterviewPipeline } from '../services/pipeline/interviewPipeline.js';
import { BatchInputFileSchema, BatchCaseResultType, BatchOutputType } from '../schemas/case.schema.js';

interface CliArgs {
  inputPath: string;
  outputPath: string;
}

/**
 * Parses CLI arguments for --input and --output
 */
function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let inputPath = '';
  let outputPath = '';

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--input' || args[i] === '-i') && i + 1 < args.length) {
      inputPath = args[i + 1];
      i++;
    } else if ((args[i] === '--output' || args[i] === '-o') && i + 1 < args.length) {
      outputPath = args[i + 1];
      i++;
    }
  }

  // Fallback if flags were stripped by npm wrapper
  if (!inputPath && args.length >= 1 && !args[0].startsWith('--')) {
    inputPath = args[0];
  }
  if (!outputPath && args.length >= 2 && !args[1].startsWith('--')) {
    outputPath = args[1];
  }

  if (!inputPath || !outputPath) {
    console.error('Usage: npm run evaluate -- --input <cases.json> --output <kits.json>');
    process.exit(1);
  }

  return {
    inputPath: path.resolve(process.cwd(), inputPath),
    outputPath: path.resolve(process.cwd(), outputPath)
  };
}

/**
 * CLI Batch Entry Point
 * Implements Section 9 & 37 of the Trao Assessment specification.
 */
async function main() {
  const { inputPath, outputPath } = parseArgs();

  console.log(`[Batch CLI] Reading input from: ${inputPath}`);
  console.log(`[Batch CLI] Writing output to: ${outputPath}`);

  if (!fs.existsSync(inputPath)) {
    console.error(`[Batch CLI Error] Input file does not exist: ${inputPath}`);
    process.exit(1);
  }

  let rawData: any;
  try {
    const fileContent = fs.readFileSync(inputPath, 'utf-8');
    rawData = JSON.parse(fileContent);
  } catch (err: any) {
    console.error(`[Batch CLI Error] Failed to parse input file as JSON: ${err.message}`);
    process.exit(1);
  }

  const parsedInput = BatchInputFileSchema.safeParse(rawData);
  if (!parsedInput.success) {
    console.error('[Batch CLI Error] Input JSON structure is invalid:');
    parsedInput.error.issues.forEach(issue => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  const cases = parsedInput.data;
  console.log(`[Batch CLI] Found ${cases.length} case(s) to process.`);

  const kitResults: BatchCaseResultType[] = [];

  for (let idx = 0; idx < cases.length; idx++) {
    const testCase = cases[idx];
    console.log(`\n------------------------------------------------------------`);
    console.log(`[Case ${idx + 1}/${cases.length}] Processing ID: "${testCase.id}"`);
    console.log(`  Company: ${testCase.company_url}`);
    console.log(`  Days: ${testCase.days}`);

    const startTime = Date.now();

    try {
      // Execute the EXACT same pipeline as the web application
      const kit = await runInterviewPipeline(
        {
          jd: testCase.jd,
          company_url: testCase.company_url,
          days: testCase.days
        },
        {
          allowLocalUrls: true, // Support local test servers (Section 9)
          onProgress: (step, pct) => {
            process.stdout.write(`\r  [${pct}%] ${step}...                   `);
          }
        }
      );

      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\r  [100%] Success in ${elapsedSec}s.                              `);

      kitResults.push({
        id: testCase.id,
        status: 'ok',
        kit,
        error: null
      });
    } catch (err: any) {
      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
      const errorCode = err.code || 'PIPELINE_ERROR';
      const errorMessage = err.message || 'Pipeline execution failed';

      console.log(`\r  [FAILED] Failed in ${elapsedSec}s: [${errorCode}] ${errorMessage} `);

      kitResults.push({
        id: testCase.id,
        status: 'failed',
        kit: null,
        error: {
          code: errorCode,
          message: errorMessage
        }
      });
    }
  }

  // Construct exact Appendix B output structure
  const outputPayload: BatchOutputType = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    kits: kitResults
  };

  // Write output atomically to avoid corruption on unexpected interrupt
  const tempPath = `${outputPath}.${Date.now()}.tmp`;
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(tempPath, JSON.stringify(outputPayload, null, 2), 'utf-8');
  fs.renameSync(tempPath, outputPath);

  console.log(`\n============================================================`);
  console.log(`[Batch CLI] Batch complete!`);
  console.log(`  Processed: ${cases.length}`);
  console.log(`  Successful: ${kitResults.filter(k => k.status === 'ok').length}`);
  console.log(`  Failed: ${kitResults.filter(k => k.status === 'failed').length}`);
  console.log(`  Output written to: ${outputPath}`);
  console.log(`============================================================\n`);

  process.exit(0);
}

main().catch(err => {
  console.error('[Fatal CLI Error]:', err);
  process.exit(1);
});
