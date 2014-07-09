// do nothing in build mode
/** @cut */ if (!basis.filename_)
/** @cut */   return;

// create separate instance of basis.js core to avoid influence on original one
// do it only in dev mode
/** @cut */ basis.createSandbox({
/** @cut */   inspect: basis,
/** @cut */   modules: {
/** @cut */     devpanel: {
/** @cut */       autoload: true,
/** @cut */       filename: basis.path.dirname(basis.filename_) + '/devpanel/index.js'
/** @cut */     }
/** @cut */   }
/** @cut */ });
