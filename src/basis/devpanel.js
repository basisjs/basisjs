/** @cut */ // do nothing in build mode
/** @cut */ if (basis.filename_)
/** @cut */ {
/** @cut */   // create separate instance of basis.js core to avoid influence on original one
/** @cut */   // do it only in dev mode
/** @cut */   basis.createSandbox({
/** @cut */     inspect: basis,
/** @cut */     devInfoResolver: basis.config.devInfoResolver,
/** @cut */     modules: {
/** @cut */       devpanel: {
/** @cut */         autoload: true,
/** @cut */         path: basis.path.dirname(basis.filename_) + '/devpanel/',
/** @cut */         filename: 'index.js'
/** @cut */       }
/** @cut */     }
/** @cut */   });
/** @cut */ }
