Pod::Spec.new do |s|
  s.name = 'FormaSoundAnalysis'
  s.version = '1.0.0'
  s.summary = 'Local iOS SoundAnalysis bridge for FORMA Sleep'
  s.description = 'Processes locally recorded audio; no raw audio leaves iPhone.'
  s.license = { :type => 'MIT' }
  s.author = 'FORMA'
  s.homepage = 'https://github.com/patrykgbt-boop/FORMA'
  s.source = { :path => '.' }
  s.platforms = { :ios => '16.4' }
  s.swift_version = '5.9'
  s.source_files = '**/*.{h,m,mm,swift}'
  s.frameworks = 'SoundAnalysis', 'AVFoundation'
  s.dependency 'ExpoModulesCore'
end
