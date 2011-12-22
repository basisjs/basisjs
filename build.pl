sub readFile{
  my $path = shift;

  print "read $path\n";
  open F, $path;
  read F, $buf, -s F;
  close F;

  my $depends = ['basis']; 

  my $buildVersion = $buf;
  $buildVersion =~ s/;;;.*$//gm;
  $buildVersion =~ s/\/\*\*\s*\@cut.*?\*\/.*$//gm;
  $buildVersion =~ s/className:\s*(namespace\s*\+\s*)?('|")[a-zA-Z0-9\.\_]+\2,?//g;

  $buildVersion =~ s/basis\.require\((['"])([^'"]+)\1\);?/
    push @{$depends}, $2;
    '';
  /gxe;

  #print join ', ', @{$depends};

  $cache->{$path} = {
    path => $path,
    debug => $buf,
    content => $buildVersion,
    depends => $depends
  };

  if ($path =~ /^src\/package/)
  {
    push @packages, $cache->{$path};
  }
}

sub readfiles{
  my $dir = shift;

  print "$dir\n";

  opendir D, $dir;
  my @list = grep { !/^\.\.?$/ } readdir D;
  closedir D;

  for my $filename (@list)
  {
    my $filepath = $dir . '/' . $filename;
    if (-d $filepath)
    {
      if ($filepath !~ /\.svn$/)
      {
        readfiles($filepath);
      }
    }
    else
    {
      readFile($filepath);
      push @{$filelist}, $filepath;
    }
  }
}


our $cache = {};
our $filelist = [];
our @packages;

my %flags = {};
for (@ARGV){
  $flags{$_} = 1;
}

readfiles('src');
print 'Read ' . @{$filelist} . ' files';
print "\n==============";

sub build{
  my $namespace = shift;
  my $context = shift || { };

  my $filename = $namespace;
  $filename =~ s/\./\//g;
  $filename = 'src/' . $filename . '.js';
  my $cfg = $cache->{$filename};
  my $result = {
    files => [],
    contentDebug => '',
    content => ''
  };

  unless ($context->{$filename})
  {
    $context->{$filename} = 1;

    for my $dep (@{$cfg->{'depends'}})
    {
      my $build = build($dep, $context);
      push @{$result->{files}}, @{$build->{files}};
      $result->{debug} .= $build->{debug};
      $result->{content} .= $build->{content};
    }

    $result->{debug} .= "\n\n//\n// " . $filename . "\n//\n\n" . $cfg->{debug};
    $result->{content} .= "\n\n//\n// " . $filename . "\n//\n\n" . $cfg->{content};
    push @{$result->{files}}, $filename;
  }

  return $result;
}

#for (keys %{$cache})
#{
#  print "$_ " . (join ", ", @{$cache->{$_}->{'depends'}}) . "\n";
#}

#print build_('package.all');
#print $cache->{'src/pack/all.js'};


for my $pack (@packages){
  my $ns = $pack->{path};
  my $package_filename = $pack->{path};
  $ns =~ s/^src\/|\.js$//g;
  $ns =~ s/\//\./g;

  my $name = $ns;
  $name =~ s/^package\.//g;
  $name =~ s/\./-/g;

  my $build = build($ns);

  print "\n\nBuild package `$name`:\n  ";
  print join "\n  ", @{$build->{files}};

  if (!$flags{'-build'})
  {
    open F, ">basis-$name.js";
    print F <<EOF;
// Package basis-$name.js

!function(){
  if (typeof document != 'undefined')
  {
    var scripts = document.getElementsByTagName('script');
    var curLocation = scripts[scripts.length - 1].src.replace(/[^\\/]+\\.js\$/, '');
EOF

    for my $file (@{$build->{files}})
    {
      next if $package_filename eq $file;
      print F "\n    document.write('<script src=\"' + curLocation + '$file\"></script>');"
    }
    print F "\n  }\n}();";
    close F;

    open F, "basis-$name.js";
    read F, my $buf, -s F;
    close F;

    open FD, ">basis-$name-debug.js";
    print FD $buf;
    close FD;
  }
  else
  {
    open F, ">basis-$name-debug.js";
    print F "// Package basis-$name-debug.js\n//   " . (join "\n//   ", @{$build->{files}});
    print F $build->{debug};
    close F;

    open F, ">basis-$name.js";
    print F "// Package basis-$name.js\n//   " . (join "\n//   ", @{$build->{files}});
    print F $build->{content};
    close F;

    unless ($flags{'-nopack'})
    {
      my $fn = "basis-$name.js";
      my $res = `java -jar c:\\tools\\gcc.jar --js $fn`;

      open F, ">$fn";
      print F <<EOF;
/*!
 * Basis javasript library 
 * http://code.google.com/p/basis-js/
 *
 * \@license
 * GNU General Public License v2.0 <http://www.gnu.org/licenses/gpl-2.0.html>
 */

EOF
      print F $res;
      close F;
    }
  }
}