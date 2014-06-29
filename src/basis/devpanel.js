// save current basis.js instance under generated name
var inspectBasisRef = 'inspectBasis_' + basis.genUID();
global[inspectBasisRef] = basis;

// load another instance of basis.js to don't influence on original one
var script = document.createElement('script');
script.setAttribute('src', basis.filename_);
script.setAttribute('basis-config',
  JSON.stringify({
    noConflict: true,
    inspectBasisRef: inspectBasisRef,
    modules: {
      devpanel: {
        autoload: true,
        filename: basis.path.dirname(basis.filename_) + '/devpanel/index.js'
      }
    }
  }).replace(/^\{|\}$/g, '')
);
basis.doc.head.add(script);

// croak namespace
delete basis.devpanel;
