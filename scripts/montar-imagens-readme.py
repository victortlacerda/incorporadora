"""Monta as imagens do README a partir das capturas de scripts/capturas-readme.mjs.
Uso: python3 scripts/montar-imagens-readme.py <pasta-capturas> [docs/imagens]
Gera JPGs leves, a montagem do celular, a página do relatório em PDF e o GIF do voo de drone.
"""
import os
import subprocess
import sys

from PIL import Image, ImageDraw

origem = sys.argv[1]
destino = sys.argv[2] if len(sys.argv) > 2 else 'docs/imagens'
os.makedirs(destino, exist_ok=True)

ESCOLHA = {
    '01-geral': 'maquete-dia.jpg',
    '02-unidade': 'unidade-painel.jpg',
    '03-noite': 'maquete-noite.jpg',
    '04-noite-rua': 'noite-rua.jpg',
    '05-espelho-disponibilidade': 'espelho-disponibilidade.jpg',
    '06-pavimento': 'corte-pavimento.jpg',
    '07-sol': 'projecao-solar.jpg',
    '08-bairro': 'entorno-bairro.jpg',
    '20-crm': 'crm-clientes.jpg',
    '21-cliente': 'crm-ficha-cliente.jpg',
    '22-relatorios': 'relatorios.jpg',
    '23-dados': 'backup-dados.jpg',
}
for nome, alvo in ESCOLHA.items():
    p = os.path.join(origem, nome + '.png')
    if os.path.exists(p):
        Image.open(p).convert('RGB').save(os.path.join(destino, alvo), quality=80, optimize=True, progressive=True)

# tour: todas as capturas ficam disponíveis com nome estável
for f in sorted(os.listdir(origem)):
    if f.startswith('10-tour-') and f.endswith('.png'):
        Image.open(os.path.join(origem, f)).convert('RGB').save(os.path.join(destino, f.replace('10-tour-', 'tour-').replace('.png', '.jpg')), quality=80, optimize=True, progressive=True)

# celular: três telas lado a lado com moldura arredondada
cel = [os.path.join(origem, n + '.png') for n in ('30-celular-geral', '31-celular-unidade', '32-celular-tour')]
cel = [c for c in cel if os.path.exists(c)]
if cel:
    larg, alt, borda, gap = 390, 844, 14, 40
    w = len(cel) * (larg + 2 * borda) + (len(cel) - 1) * gap + 80
    h = alt + 2 * borda + 80
    base = Image.new('RGB', (w, h), (15, 18, 22))
    for i, c in enumerate(cel):
        x = 40 + i * (larg + 2 * borda + gap)
        moldura = Image.new('RGBA', (larg + 2 * borda, alt + 2 * borda), (0, 0, 0, 0))
        ImageDraw.Draw(moldura).rounded_rectangle([0, 0, larg + 2 * borda - 1, alt + 2 * borda - 1], radius=48, fill=(42, 46, 52, 255))
        base.paste(moldura, (x, 40), moldura)
        tela = Image.open(c).convert('RGB').resize((larg, alt))
        mascara = Image.new('L', (larg, alt), 0)
        ImageDraw.Draw(mascara).rounded_rectangle([0, 0, larg - 1, alt - 1], radius=36, fill=255)
        base.paste(tela, (x + borda, 40 + borda), mascara)
    base = base.resize((w * 2 // 3, h * 2 // 3), Image.LANCZOS)
    base.save(os.path.join(destino, 'celular.jpg'), quality=82, optimize=True, progressive=True)

# relatório PDF: primeira página e espelho
pdf = os.path.join(origem, 'relatorio.pdf')
if os.path.exists(pdf):
    subprocess.run(['pdftoppm', '-r', '70', '-png', '-f', '1', '-l', '2', pdf, os.path.join(origem, 'pdfp')], check=True)
    paginas = sorted(f for f in os.listdir(origem) if f.startswith('pdfp'))
    imgs = [Image.open(os.path.join(origem, f)).convert('RGB') for f in paginas]
    w = sum(i.width for i in imgs) + 20 * (len(imgs) + 1)
    h = max(i.height for i in imgs) + 40
    base = Image.new('RGB', (w, h), (232, 234, 237))
    x = 20
    for i in imgs:
        base.paste(i, (x, 20)); x += i.width + 20
    base.save(os.path.join(destino, 'relatorio-pdf.jpg'), quality=82, optimize=True, progressive=True)

# GIF do voo de drone
quadros = os.path.join(origem, 'gif')
if os.path.isdir(quadros) and os.listdir(quadros):
    paleta = os.path.join(origem, 'paleta.png')
    entrada = ['-framerate', '9', '-i', os.path.join(quadros, 'q%03d.png')]
    filtro = 'scale=560:-1:flags=lanczos'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *entrada, '-vf', f'{filtro},palettegen=max_colors=96:stats_mode=diff', paleta], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *entrada, '-i', paleta, '-lavfi', f'{filtro}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle', '-loop', '0', os.path.join(destino, 'voo-drone.gif')], check=True)

for f in sorted(os.listdir(destino)):
    print(f'{f:36s} {os.path.getsize(os.path.join(destino, f)) // 1024:6d} KB')
