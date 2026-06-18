import { LyraMemory, ChronicleEntry } from '@project-veyra/shared';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface StorageResult {
  hash: string;
  success: boolean;
  error?: string;
}

const OG_EVM_RPC = process.env.OG_EVM_RPC || 'https://evmrpc-testnet.0g.ai';
const OG_INDEXER_RPC = process.env.OG_INDEXER_RPC || 'https://indexer-storage-testnet-turbo.0g.ai';
const OG_PRIVATE_KEY = process.env.OG_PRIVATE_KEY || '';
const MOCK_DIR = path.join(os.tmpdir(), 'veyra-og-mock');

export class OGStorageService {
  private useReal: boolean;

  constructor(useReal = false) {
    this.useReal = useReal && !!OG_PRIVATE_KEY;
    if (!this.useReal) {
      fs.mkdirSync(MOCK_DIR, { recursive: true });
    }
  }

  async uploadLyraMemory(playerId: string, memory: LyraMemory): Promise<StorageResult> {
    const data = JSON.stringify(memory, null, 2);
    const fileName = `lyra-memory-${playerId}.json`;
    return this.upload(data, fileName);
  }

  async downloadLyraMemory(hash: string): Promise<LyraMemory | null> {
    const data = await this.download(hash);
    return data ? JSON.parse(data) as LyraMemory : null;
  }

  async uploadChronicle(entries: ChronicleEntry[]): Promise<StorageResult> {
    const data = JSON.stringify(entries, null, 2);
    const fileName = `chronicle-${Date.now()}.json`;
    return this.upload(data, fileName);
  }

  async downloadChronicle(hash: string): Promise<ChronicleEntry[] | null> {
    const data = await this.download(hash);
    return data ? JSON.parse(data) as ChronicleEntry[] : null;
  }

  async uploadWorldState(state: Record<string, unknown>): Promise<StorageResult> {
    const data = JSON.stringify(state, null, 2);
    return this.upload(data, 'world-state.json');
  }

  private async upload(data: string, fileName: string): Promise<StorageResult> {
    if (this.useReal) {
      return this.uploadTo0G(data, fileName);
    }
    return this.uploadMock(data, fileName);
  }

  private async download(hash: string): Promise<string | null> {
    if (this.useReal) {
      return this.downloadFrom0G(hash);
    }
    return this.downloadMock(hash);
  }

  private async uploadTo0G(data: string, fileName: string): Promise<StorageResult> {
    try {
      const { Indexer, ZgFile } = await import('@0gfoundation/0g-storage-ts-sdk');
      const { ethers } = await import('ethers');

      const tmpPath = path.join(os.tmpdir(), fileName);
      fs.writeFileSync(tmpPath, data, 'utf-8');

      const file = await ZgFile.fromFilePath(tmpPath);
      const [tree, treeErr] = await file.merkleTree();
      if (treeErr || !tree) {
        await file.close();
        return { hash: '', success: false, error: String(treeErr) };
      }

      const rootHash = tree.rootHash();
      if (!rootHash) {
        await file.close();
        return { hash: '', success: false, error: 'rootHash is null' };
      }
      const provider = new ethers.JsonRpcProvider(OG_EVM_RPC);
      const signer = new ethers.Wallet(OG_PRIVATE_KEY, provider);
      const indexer = new Indexer(OG_INDEXER_RPC);

      const [tx, err] = await indexer.upload(file, OG_EVM_RPC, signer);
      await file.close();

      fs.unlinkSync(tmpPath);

      if (err) {
        return { hash: '', success: false, error: String(err) };
      }

      return { hash: rootHash, success: true };
    } catch (err: any) {
      return { hash: '', success: false, error: err.message };
    }
  }

  private async downloadFrom0G(hash: string): Promise<string | null> {
    try {
      const { Indexer } = await import('@0gfoundation/0g-storage-ts-sdk');
      const indexer = new Indexer(OG_INDEXER_RPC);

      const outputPath = path.join(os.tmpdir(), `og-dl-${hash.slice(0, 16)}.json`);
      const err = await indexer.download(hash, outputPath, true);
      if (err) return null;

      const content = fs.readFileSync(outputPath, 'utf-8');
      fs.unlinkSync(outputPath);
      return content;
    } catch {
      return null;
    }
  }

  private uploadMock(data: string, fileName: string): StorageResult {
    const hash = '0x' + this.simpleHash(data);
    const filePath = path.join(MOCK_DIR, hash);
    fs.writeFileSync(filePath, data, 'utf-8');
    return { hash, success: true };
  }

  private downloadMock(hash: string): string | null {
    const filePath = path.join(MOCK_DIR, hash);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf-8');
  }

  private simpleHash(data: string): string {
    let h = 0;
    for (let i = 0; i < data.length; i++) {
      h = ((h << 5) - h) + data.charCodeAt(i);
      h = h & h;
    }
    return Math.abs(h).toString(16).padStart(64, '0');
  }
}
