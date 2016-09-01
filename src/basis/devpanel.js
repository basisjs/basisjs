/** @cut */ // do nothing in build mode
/** @cut */ if (basis.filename_)
/** @cut */ {
/** @cut */   // create separate instance of basis.js core to avoid influence on original one
/** @cut */   // do it only in dev mode
/** @cut */   basis.createSandbox({
/** @cut */     inspect: basis,
/** @cut */     devInfoResolver: basis.config.devInfoResolver,
/** @cut */     modules: {
/** @cut */       api: {
/** @cut */         path: basis.path.resolve(__dirname, '../devpanel/api/index.js')
/** @cut */       },
/** @cut */       type: {
/** @cut */         path: basis.path.resolve(__dirname, '../devpanel/type/'),
/** @cut */         filename: 'index.js'
/** @cut */       },
/** @cut */       devpanel: {
/** @cut */         autoload: true,
/** @cut */         path: basis.path.resolve(__dirname, '../devpanel/'),
/** @cut */         filename: 'index.js'
/** @cut */       }
/** @cut */     }
/** @cut */   });
/** @cut */ }
