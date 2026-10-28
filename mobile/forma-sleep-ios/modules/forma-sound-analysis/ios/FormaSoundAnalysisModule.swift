import Foundation
import ExpoModulesCore
import SoundAnalysis
import CoreMedia

private struct SoundWindow {
  let start: Double
  let end: Double
  let confidence: Double
}

private final class NightSoundObserver: NSObject, SNResultsObserving {
  private let snoreLabels: [String]
  private let coughLabels: [String]
  private let lock = NSLock()
  private var snoreWindows: [SoundWindow] = []
  private var coughWindows: [SoundWindow] = []
  private var failure: String?

  init(snore: [String], cough: [String]) {
    self.snoreLabels = snore
    self.coughLabels = cough
  }

  func request(_ request: SNRequest, didProduce result: SNResult) {
    guard let classification = result as? SNClassificationResult else { return }
    let start = CMTimeGetSeconds(classification.timeRange.start)
    let length = CMTimeGetSeconds(classification.timeRange.duration)
    guard start.isFinite, length.isFinite, length > 0 else { return }
    let end = start + length
    let snore = snoreLabels.compactMap { classification.classification(forIdentifier: $0)?.confidence }.max() ?? 0
    let cough = coughLabels.compactMap { classification.classification(forIdentifier: $0)?.confidence }.max() ?? 0
    lock.lock()
    if snore >= 0.60 { snoreWindows.append(SoundWindow(start: start, end: end, confidence: snore)) }
    if cough >= 0.70 { coughWindows.append(SoundWindow(start: start, end: end, confidence: cough)) }
    lock.unlock()
  }

  func request(_ request: SNRequest, didFailWithError error: Error) {
    lock.lock()
    failure = error.localizedDescription
    lock.unlock()
  }

  func requestDidComplete(_ request: SNRequest) {}

  func summary(snoreSupported: Bool, coughSupported: Bool) -> [String: Any] {
    lock.lock()
    let snores = snoreWindows
    let coughs = coughWindows
    let error = failure
    lock.unlock()

    func merged(_ windows: [SoundWindow]) -> [SoundWindow] {
      var result: [SoundWindow] = []
      for current in windows.sorted(by: { $0.start < $1.start }) {
        if let last = result.last, current.start <= last.end + 8.0 {
          result[result.count - 1] = SoundWindow(start: last.start, end: max(last.end, current.end),
                                                   confidence: max(last.confidence, current.confidence))
        } else {
          result.append(current)
        }
      }
      return result
    }

    let snoreEvents = merged(snores)
    let coughEvents = merged(coughs)
    let snoreSeconds = snoreEvents.reduce(0.0) { $0 + ($1.end - $1.start) }
    let coughSeconds = coughEvents.reduce(0.0) { $0 + ($1.end - $1.start) }
    return [
      "snoreSupported": snoreSupported,
      "coughSupported": coughSupported,
      "snoreEvents": snoreEvents.count,
      "coughEvents": coughEvents.count,
      "snoreSeconds": Int(snoreSeconds.rounded()),
      "coughSeconds": Int(coughSeconds.rounded()),
      "snoreIntervals": snoreEvents.prefix(200).map {
        ["start": Int($0.start), "end": Int($0.end), "confidence": $0.confidence] as [String: Any]
      },
      "classificationError": error ?? ""
    ]
  }
}

public class FormaSoundAnalysisModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FormaSoundAnalysis")
    AsyncFunction("analyzeAudioFile") { (uri: String, promise: Promise) in
      guard let url = URL(string: uri), url.isFileURL else {
        promise.reject("INVALID_URI", "Wymagana jest lokalna ścieżka file://")
        return
      }
      do {
        let request = try SNClassifySoundRequest(classifierIdentifier: .version1)
        let snore = request.knownClassifications.filter { $0.lowercased().contains("snor") }
        let cough = request.knownClassifications.filter { $0.lowercased().contains("cough") }
        // Nie zakładamy, że wersja klasyfikatora Apple zawsze udostępnia etykietę 'snoring'.
        if snore.isEmpty && cough.isEmpty {
          promise.resolve([
            "snoreSupported": false, "coughSupported": false,
            "snoreEvents": 0, "coughEvents": 0,
            "snoreSeconds": 0, "coughSeconds": 0,
            "snoreIntervals": [], "classificationError": ""
          ] as [String: Any])
          return
        }
        let observer = NightSoundObserver(snore: snore, cough: cough)
        let analyzer = try SNAudioFileAnalyzer(url: url)
        try analyzer.add(request, withObserver: observer)
        analyzer.analyze { reachedEnd in
          let output = observer.summary(snoreSupported: !snore.isEmpty, coughSupported: !cough.isEmpty)
          if !reachedEnd || !(output["classificationError"] as? String ?? "").isEmpty {
            promise.reject("ANALYSIS_INCOMPLETE", (output["classificationError"] as? String).flatMap { $0.isEmpty ? nil : $0 } ?? "Nie udało się przeanalizować całego nagrania.")
          } else {
            promise.resolve(output)
          }
          // Capturing the analyzer and observer keeps them alive until completion.
          _ = analyzer
        }
      } catch {
        promise.reject("ANALYSIS_FAILED", error.localizedDescription)
      }
    }
  }
}
