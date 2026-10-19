from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
source = root / 'industrial-software-atlas.html'
if not source.is_file():
    raise SystemExit('Run scripts/build-atlas.py and checks before packaging.')
destination = root / '_site'
destination.mkdir(exist_ok=True)
shutil.copyfile(source, destination / 'index.html')
(destination / '.nojekyll').touch()
print('Packaged _site/index.html')
