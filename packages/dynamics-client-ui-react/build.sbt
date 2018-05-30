import scala.sys.process._

lazy val licenseSettings = Seq(
  headerMappings := headerMappings.value +
    (HeaderFileType.scala -> HeaderCommentStyle.cppStyleLineComment),
    headerLicense  := Some(HeaderLicense.Custom(
      """|Copyright (c) 2018 The Trapelo Group LLC
         |This software is licensed under the MIT License (MIT).
         |For more information see LICENSE or https://opensource.org/licenses/MIT
         |""".stripMargin
    )))


lazy val macroSettings = Seq (
  resolvers += Resolver.sonatypeRepo("releases"),
  resolvers += Resolver.bintrayRepo("scalameta", "maven"),
  addCompilerPlugin("org.scalameta" % "paradise" % "3.0.0-M11" cross CrossVersion.full),
  scalacOptions += "-Xplugin-require:macroparadise",
)

lazy val buildSettings = Seq(
  organization := "ttg-dynamics-client",
  licenses ++= Seq(("MIT", url("http://opensource.org/licenses/MIT"))),
  scalaVersion := "2.12.4",
  resolvers += Resolver.sonatypeRepo("releases"),
  resolvers += Resolver.jcenterRepo,
  scalafmtVersion in ThisBuild := "1.5.1",
  autoCompilerPlugins := true
) ++ licenseSettings

lazy val noPublishSettings = Seq(
  skip in publish := true, // this did not seem to work
  publish := {},
  publishLocal :={},
  publishArtifact := false 
)

lazy val publishSettings = Seq(
  homepage := Some(url("https://github.com/aappddeevv/scalajs-react"))
)

val commonScalacOptions = Seq(
    "-deprecation",
    "-encoding", "UTF-8",
    "-feature",
    "-language:_",
    "-unchecked",
    "-Yno-adapted-args",
    "-Ywarn-numeric-widen",
    "-Xfuture",
    "-Ypartial-unification",
  )

lazy val commonSettings = Seq(
  scalacOptions ++= commonScalacOptions ++
        (if (scalaJSVersion.startsWith("0.6."))
      Seq("-P:scalajs:sjsDefinedByDefault")
        else Nil),
  scalaJSLinkerConfig ~= { _.withModuleKind(ModuleKind.CommonJSModule) },
  libraryDependencies ++= Seq(
    "org.typelevel" %%% "cats-core" % "1.1.0",
    "org.typelevel" %%% "cats-effect" % "latest.version",
    "org.scala-js" %%% "scalajs-dom" % "latest.version"),
  addCompilerPlugin("org.spire-math" %% "kind-projector" % "0.9.4"),
  autoAPIMappings := true,
  // need scalajs-react libraries
  libraryDependencies ++= Seq(
    //"ttg" %%% "scalajs-react-core" % "0.1.0-M4",
    //"ttg" %%% "scalajs-react-react-dom" %  "0.1.0-M4",
    //"ttg" %%% "scalajs-react-vdom" %  "0.1.0-M4",
    //"ttg" %%% "scalajs-react-fabric" %  "0.1.0-M4"
  )
)

// based on a local os symbolic link...
lazy val scalajs_react_fabric =
  ProjectRef(file("scalajs-react"), "scalajs-react-fabric")
lazy val scalajs_react_core =
  ProjectRef(file("scalajs-react"), "scalajs-react-core")
lazy val scalajs_react_vdom =
  ProjectRef(file("scalajs-react"), "scalajs-react-vdom")

lazy val libsettings = buildSettings ++ commonSettings

lazy val root = project.in(file("."))
  .settings(libsettings)
  .settings(noPublishSettings)
  .settings(name := "ui-react")
  .aggregate(addresseditor)
  .enablePlugins(ScalaJSPlugin, AutomateHeaderPlugin)
  .disablePlugins(BintrayPlugin)

lazy val common = project.in(file("./scala/common"))
  .settings(name := "ui-react-common")
  .settings(libsettings)
  .settings(publishSettings)
  .dependsOn(scalajs_react_fabric, scalajs_react_core, scalajs_react_vdom) // for interactive dev
  .enablePlugins(ScalaJSPlugin, AutomateHeaderPlugin)
  .settings(
    description := "Address editor.",
  )

lazy val addresseditor = project.in(file("./scala/addresseditor"))
  .settings(name := "ui-react-addresseditor")
  .settings(libsettings)
  .settings(publishSettings)
  .dependsOn(scalajs_react_fabric, scalajs_react_core, scalajs_react_vdom, common) // for interactive dev
  .enablePlugins(ScalaJSPlugin, AutomateHeaderPlugin)
  .settings(
    description := "Address editor.",
  )

// ?
watchSources += baseDirectory.value / "examples/src/main/assets"

addCommandAlias("fmt", ";scalafmt")

val npmBuild = taskKey[Unit]("fullOptJS then webpack")
npmBuild := {
  (fullOptJS in (addresseditor, Compile)).value
  "npm run examples" !
}

val npmBuildFast = taskKey[Unit]("fastOptJS then webpack")
npmBuildFast := {
  (fastOptJS in (addresseditor, Compile)).value
  "npm run examples:dev" !
}

// must run publish and release separately
// don't forget bintray & unpublish
// use packagedArtifacts to build artifacts in each project's target
// to release: publish then bintrayRelease (to release them)
bintrayReleaseOnPublish in ThisBuild := false
bintrayPackageLabels := Seq("scala.js", "react", "office")
bintrayVcsUrl := Some("git:git@github.com:aappddeevv/scalajs-react")
bintrayRepository := "maven"
