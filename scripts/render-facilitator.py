import re,sys,os
tpl=open(sys.argv[1]).read(); root=sys.argv[2]  # root containing branch worktrees step-N dirs
def f(m):
    n,p=m.group(1),m.group(2)
    return open(os.path.join(root,f'step-{n}',p)).read().rstrip('\n')
def sec(m):
    n,p,h=m.group(1),m.group(2),m.group(3)
    t=open(os.path.join(root,f'step-{n}',p)).read()
    return t[t.index(h):].rstrip('\n')
out=re.sub(r'\{\{file:(\d):([^}]+)\}\}',f,tpl)
def lines(m):
    n,p,r=m.group(1),m.group(2),m.group(3); a,b=map(int,r.split('-'))
    rows=open(os.path.join(root,f'step-{n}',p)).readlines()
    if not 1<=a<=b<=len(rows): sys.exit(f'{p} on step-{n} has {len(rows)} lines; {{{{lines}}}} range {a}-{b} is out of bounds')
    return ''.join(rows[a-1:b]).rstrip('\n')
out=re.sub(r'\{\{lines:(\d):([^:]+):([^}]+)\}\}',lines,out)
out=re.sub(r'\{\{section:(\d):([^:]+):([^}]+)\}\}',sec,out)
sys.stdout.write(out)
