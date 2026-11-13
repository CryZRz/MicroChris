"""Run on each build host; downloads only occur when building the application."""
from pathlib import Path
import hashlib,json,platform,shutil,subprocess,tarfile,tempfile,urllib.request,zipfile
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'src-tauri/toolchain'
CACHE=ROOT/'.tool-cache'
CACHE.mkdir(exist_ok=True)
def download(url,sha,name):
    p=CACHE/name
    if not p.exists():
        print('Downloading',url,flush=True)
        with urllib.request.urlopen(url) as response,p.open('wb') as f: shutil.copyfileobj(response,f)
    if hashlib.sha256(p.read_bytes()).hexdigest()!=sha.lower():raise RuntimeError('Checksum mismatch: '+str(p))
    return p
def extract(p,d):
    if zipfile.is_zipfile(p):
        with zipfile.ZipFile(p) as z:
            for n in z.namelist():
                if not (d/n).resolve().is_relative_to(d.resolve()):raise RuntimeError('Unsafe archive')
            z.extractall(d)
    else:
        with tarfile.open(p) as t:t.extractall(d,filter='data')
for d in ['bin','include','licenses','sources']: (DEST/d).mkdir(exist_ok=True)
system=platform.system();arch=platform.machine().lower()
host={'Linux':'x86_64-linux-gnu','Windows':'i686-mingw32','Darwin':'x86_64-apple-darwin12'}[system]
if system=='Linux' and arch in ('arm64','aarch64'):host='aarch64-linux-gnu'
lock=json.loads((ROOT/'scripts/avrdude-lock.json').read_text())
entry=next(s for s in lock['systems'] if s['host']==host)
archive=download(entry['url'],entry['checksum'].split(':')[1],entry['archiveFileName'])
with tempfile.TemporaryDirectory() as tmp:
    d=Path(tmp);extract(archive,d)
    for p in d.rglob('*'):
        if not p.is_file():continue
        if p.name in ('avrdude','avrdude.exe') or p.suffix.lower() in ('.dll','.dylib') or '.so' in p.name:
            shutil.copy2(p,DEST/'bin'/p.name)
        elif p.name=='avrdude.conf':shutil.copy2(p,DEST/p.name)
        elif 'license' in p.name.lower() or 'copying' in p.name.lower():shutil.copy2(p,DEST/'licenses'/('avrdude-'+p.name))
shutil.copy2(archive,DEST/'sources'/archive.name)
avra=download('https://codeload.github.com/Ro5bert/avra/tar.gz/refs/tags/1.4.2','cc56837be973d1a102dc6936a0b7235a1d716c0f7cd053bf77e0620577cff986','avra-1.4.2.tar.gz')
with tempfile.TemporaryDirectory() as tmp:
    d=Path(tmp);extract(avra,d);src=d/'avra-1.4.2'
    # A single native C executable; Windows CI uses the MinGW shell.
    names='avra device parser expr mnemonic directiv macro file map coff args stdextra'.split()
    binary=src/'src'/('avra.exe' if system=='Windows' else 'avra')
    subprocess.run(['gcc','-O2','-DVERSION="1.4.2"','-DDEFAULT_INCLUDE_PATH="."','-o',str(binary),*[str(src/'src'/(n+'.c')) for n in names]],check=True)
    binary=src/'src'/('avra.exe' if system=='Windows' else 'avra')
    shutil.copy2(binary,DEST/'bin'/binary.name)
    for p in (src/'includes').glob('*'):shutil.copy2(p,DEST/'include'/p.name)
    shutil.copy2(src/'COPYING',DEST/'licenses/avra-COPYING')
shutil.copy2(avra,DEST/'sources'/avra.name)
for name in ['avra','avrdude']:
    p=DEST/'bin'/name
    if p.exists():p.chmod(0o755)
(DEST/'manifest.json').write_text(json.dumps({'avra':'1.4.2','avrdude':lock['version'],'host':host,'macOSArmRequiresRosetta':system=='Darwin' and arch=='arm64'},indent=2))

source=download('https://codeload.github.com/avrdudes/avrdude/tar.gz/refs/tags/v8.0','a689d70a826e2aa91538342c46c77be1987ba5feb9f7dab2606b8dae5d2a52d5','avrdude-8.0.tar.gz')
shutil.copy2(source,DEST/'sources'/source.name)
with tempfile.TemporaryDirectory() as tmp:
    d=Path(tmp);extract(source,d)
    for name in ['COPYING','LICENSE']:
        for p in d.rglob(name):shutil.copy2(p,DEST/'licenses'/('avrdude-'+name))

# macOS ARM has no native archive in Arduino's index: build serial-only AVRDUDE.
if system=='Darwin':
    with tempfile.TemporaryDirectory() as tmp:
        d=Path(tmp);extract(source,d);src=d/'avrdude-8.0';build=d/'build'
        flags=['-DBUILD_SHARED_LIBS=OFF','-DBUILD_DOC=OFF','-DCMAKE_DISABLE_FIND_PACKAGE_SWIG=TRUE']
        for lib in ['HAVE_LIBUSB','HAVE_LIBUSB_1_0','HAVE_LIBUSB_WIN32','HAVE_LIBHIDAPI','HAVE_LIBFTDI','HAVE_LIBFTDI1','HAVE_LIBELF','HAVE_LIBREADLINE']:
            flags.append('-D'+lib+':FILEPATH=')
        subprocess.run(['cmake','-S',str(src),'-B',str(build),*flags],check=True)
        subprocess.run(['cmake','--build',str(build),'--parallel','2'],check=True)
        shutil.copy2(build/'src/avrdude',DEST/'bin/avrdude')
        shutil.copy2(build/'src/avrdude.conf',DEST/'avrdude.conf')
    manifest=json.loads((DEST/'manifest.json').read_text());manifest.update(avrdude='8.0',macOSArmRequiresRosetta=False)
    (DEST/'manifest.json').write_text(json.dumps(manifest,indent=2))

recipe=download('https://codeload.github.com/arduino/avrdude-packing/tar.gz/refs/tags/8.0-arduino.1','7b5008185b1c6ac3ee2a077ffd1309f74462dd5dcca81dd80b2d4ea63b6b9ad1','avrdude-packing-8.0-arduino.1.tar.gz')
shutil.copy2(recipe,DEST/'sources'/recipe.name)
print('Toolchain ready:',DEST)
