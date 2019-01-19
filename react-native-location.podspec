require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name           = 'react-native-location'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = 'https://github.com/timfpark/react-native-location'
  s.source         = { :git => "https://github.com/timfpark/react-native-location.git", :tag => "#{s.version}" }
  s.framework      = 'CoreLocation'
  s.source_files   = "ios/**/*.{h,m}"

  s.ios.deployment_target = "8.0"

  s.dependency "React"
end