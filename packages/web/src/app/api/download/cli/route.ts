import { NextResponse } from 'next/server';

const CLI_DOWNLOADS = {
  'darwin-x64': {
    url: 'https://github.com/forge-ai/cli/releases/latest/download/forge-darwin-x64.tar.gz',
    filename: 'forge-darwin-x64.tar.gz',
    size: '15.2 MB'
  },
  'darwin-arm64': {
    url: 'https://github.com/forge-ai/cli/releases/latest/download/forge-darwin-arm64.tar.gz', 
    filename: 'forge-darwin-arm64.tar.gz',
    size: '14.8 MB'
  },
  'win32-x64': {
    url: 'https://github.com/forge-ai/cli/releases/latest/download/forge-win32-x64.zip',
    filename: 'forge-win32-x64.zip',
    size: '16.1 MB'
  },
  'linux-x64': {
    url: 'https://github.com/forge-ai/cli/releases/latest/download/forge-linux-x64.tar.gz',
    filename: 'forge-linux-x64.tar.gz', 
    size: '15.5 MB'
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const arch = searchParams.get('arch');
  
  if (!platform || !arch) {
    return NextResponse.json({
      error: 'Platform and architecture required',
      available: Object.keys(CLI_DOWNLOADS)
    }, { status: 400 });
  }
  
  const key = `${platform}-${arch}`;
  const download = CLI_DOWNLOADS[key as keyof typeof CLI_DOWNLOADS];
  
  if (!download) {
    return NextResponse.json({
      error: 'Platform not supported',
      available: Object.keys(CLI_DOWNLOADS)
    }, { status: 404 });
  }
  
  return NextResponse.json({
    platform,
    arch,
    download: {
      url: download.url,
      filename: download.filename,
      size: download.size,
      version: '1.0.0'
    }
  });
}