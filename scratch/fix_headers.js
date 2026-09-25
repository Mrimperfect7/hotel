const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = 'c:\\hotel\\apps\\web\\src\\app';

walkDir(targetDir, function(filePath) {
  if (filePath.endsWith('.tsx') && !filePath.endsWith('layout.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/import \{ SiteHeader \} from '@\/components\/site-header';\r?\n?/g, '');
    content = content.replace(/import \{ SiteFooter \} from '@\/components\/site-footer';\r?\n?/g, '');
    content = content.replace(/<SiteHeader \/>\r?\n?/g, '');
    content = content.replace(/<SiteFooter \/>\r?\n?/g, '');

    // Also strip out unnecessary wrapping div if it exists just to hold the header/footer
    // Actually, it's safer to just remove the header and footer tags as done above. 
    // They are often inside a <div className="flex min-h-screen flex-col">...</div> which is fine to keep, though redundant.

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed', filePath);
    }
  }
});
